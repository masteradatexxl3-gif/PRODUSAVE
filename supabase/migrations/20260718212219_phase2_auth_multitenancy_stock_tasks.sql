/*
# PRODUSAVE Fase 2 - Auth, Multi-tenancy, Stock Separation, Tareas, Broadcast

## Resumen
Migración que prepara la base para autenticación real con aislamiento estricto por tenant,
separación de stock (Bodega vs Caja), sistema de tareas de reposición, canal de difusión
del Super Admin, control de suscripción mensual y último acceso de empleados.

## Cambios a Tablas Existentes

1. `tenants` — Agrega:
   - `subscription_expires_at` (timestamptz, fecha de expiración mensual)
   - `plan` (text, versión de prueba / pro / enterprise)
   - `logo_url` ya existe para imagen de branding subida

2. `products` — Agrega:
   - `warehouse_stock` (int, stock en bodega/depósito, default 0)
   - `published_stock` (int, stock publicado en caja/POS, default 0)
   - Mantiene `stock` como alias de `published_stock` para compatibilidad

3. `profiles` — Agrega:
   - `last_seen_at` (timestamptz, última conexión en caja/POS)

## Tablas Nuevas

1. `tasks` — Tareas de reposición enviadas por el jefe al empleado
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `product_id` (uuid, FK a products)
   - `quantity` (int, unidades a reponer)
   - `assigned_to` (uuid, FK a profiles, empleado asignado)
   - `created_by` (uuid, FK a profiles, jefe que envió)
   - `status` (text, pending/completed)
   - `completed_at` (timestamptz)
   - `created_at` (timestamptz)

2. `broadcast_messages` — Canal de difusión obligatorio del Super Admin
   - `id` (uuid, PK)
   - `title` (text)
   - `message` (text)
   - `created_by` (uuid, FK a profiles)
   - `created_at` (timestamptz)
   - Solo super_admin puede escribir; todos pueden leer.

## Seguridad (RLS)
- TODAS las políticas anteriores (anon, authenticated) se eliminan.
- Se reemplazan con políticas `TO authenticated` estrictas basadas en `auth.uid()`.
- Aislamiento por `tenant_id`: un usuario solo ve datos de su propio negocio.
- El super_admin ve todo (via `is_super_admin()`).
- Broadcast: todos los authenticated pueden SELECT, solo super_admin puede INSERT.
- Tasks: visibles para el tenant; insert/update por miembros del tenant.

## Notas
1. `warehouse_stock` se llena desde Recepción de Mercadería.
2. `published_stock` es lo que el POS muestra y descuenta al vender.
3. El jefe "Publica en Caja" moviendo stock de warehouse a published.
4. `last_seen_at` se actualiza desde el POS del empleado.
5. Los planes se renombran: trial → "version_de_prueba", pro, enterprise.
*/
-- Agregar columnas a tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'version_de_prueba';

-- Agregar columnas a products
ALTER TABLE products ADD COLUMN IF NOT EXISTS warehouse_stock INT NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS published_stock INT NOT NULL DEFAULT 0;

-- Agregar columna last_seen_at a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Sincronizar published_stock con stock existente (una sola vez)
UPDATE products SET published_stock = stock WHERE published_stock = 0 AND stock > 0;

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de broadcast (canal de difusión del super admin)
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en tablas nuevas
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Índices nuevos
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_created ON broadcast_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_tenants_expires ON tenants(subscription_expires_at);

-------------------------------------------------------------------------------
-- ELIMINAR POLÍTICAS ANTERIORES (anon) Y REEMPLAZAR CON authenticated
-------------------------------------------------------------------------------

-- TENANTS: super_admin ve todo; boss/employee ve su propio tenant
DROP POLICY IF EXISTS "tenants_select_all" ON tenants;
CREATE POLICY "tenants_select_authenticated" ON tenants FOR SELECT TO authenticated
    USING (is_super_admin() OR id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenants_insert_all" ON tenants;
CREATE POLICY "tenants_insert_superadmin" ON tenants FOR INSERT TO authenticated
    WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "tenants_update_all" ON tenants;
CREATE POLICY "tenants_update_authenticated" ON tenants FOR UPDATE TO authenticated
    USING (is_super_admin() OR id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "tenants_delete_all" ON tenants;
CREATE POLICY "tenants_delete_superadmin" ON tenants FOR DELETE TO authenticated
    USING (is_super_admin());

-- PROFILES: super_admin ve todo; usuario ve su propio perfil; miembros del tenant se ven entre sí
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_authenticated" ON profiles FOR SELECT TO authenticated
    USING (is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
CREATE POLICY "profiles_insert_authenticated" ON profiles FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
CREATE POLICY "profiles_update_authenticated" ON profiles FOR UPDATE TO authenticated
    USING (is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
CREATE POLICY "profiles_delete_superadmin" ON profiles FOR DELETE TO authenticated
    USING (is_super_admin());

-- CATEGORIES: aisladas por tenant
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_authenticated" ON categories FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "categories_insert_all" ON categories;
CREATE POLICY "categories_insert_authenticated" ON categories FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "categories_update_all" ON categories;
CREATE POLICY "categories_update_authenticated" ON categories FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "categories_delete_all" ON categories;
CREATE POLICY "categories_delete_authenticated" ON categories FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- PRODUCTS: aislados por tenant
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_authenticated" ON products FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "products_insert_all" ON products;
CREATE POLICY "products_insert_authenticated" ON products FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "products_update_all" ON products;
CREATE POLICY "products_update_authenticated" ON products FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "products_delete_all" ON products;
CREATE POLICY "products_delete_authenticated" ON products FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- SALES: aisladas por tenant
DROP POLICY IF EXISTS "sales_select_all" ON sales;
CREATE POLICY "sales_select_authenticated" ON sales FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sales_insert_all" ON sales;
CREATE POLICY "sales_insert_authenticated" ON sales FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sales_update_all" ON sales;
CREATE POLICY "sales_update_authenticated" ON sales FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "sales_delete_all" ON sales;
CREATE POLICY "sales_delete_authenticated" ON sales FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- SALE_ITEMS: aislados via sale_id → tenant
DROP POLICY IF EXISTS "sale_items_select_all" ON sale_items;
CREATE POLICY "sale_items_select_authenticated" ON sale_items FOR SELECT TO authenticated
    USING (
        is_super_admin() OR
        EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "sale_items_insert_all" ON sale_items;
CREATE POLICY "sale_items_insert_authenticated" ON sale_items FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin() OR
        EXISTS (SELECT 1 FROM sales WHERE sales.id = sale_items.sale_id AND sales.tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "sale_items_update_all" ON sale_items;
CREATE POLICY "sale_items_update_authenticated" ON sale_items FOR UPDATE TO authenticated
    USING (is_super_admin());

DROP POLICY IF EXISTS "sale_items_delete_all" ON sale_items;
CREATE POLICY "sale_items_delete_authenticated" ON sale_items FOR DELETE TO authenticated
    USING (is_super_admin());

-- CREDITS: aislados por tenant
DROP POLICY IF EXISTS "credits_select_all" ON credits;
CREATE POLICY "credits_select_authenticated" ON credits FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "credits_insert_all" ON credits;
CREATE POLICY "credits_insert_authenticated" ON credits FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "credits_update_all" ON credits;
CREATE POLICY "credits_update_authenticated" ON credits FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "credits_delete_all" ON credits;
CREATE POLICY "credits_delete_authenticated" ON credits FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- CHAT_MESSAGES: aislados por tenant (o NULL para chat global de soporte)
DROP POLICY IF EXISTS "chat_messages_select_all" ON chat_messages;
CREATE POLICY "chat_messages_select_authenticated" ON chat_messages FOR SELECT TO authenticated
    USING (
        is_super_admin() OR
        tenant_id IS NULL OR
        tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()) OR
        sender_id = auth.uid() OR
        receiver_id = auth.uid()
    );

DROP POLICY IF EXISTS "chat_messages_insert_all" ON chat_messages;
CREATE POLICY "chat_messages_insert_authenticated" ON chat_messages FOR INSERT TO authenticated
    WITH CHECK (
        is_super_admin() OR
        sender_id = auth.uid() OR
        tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "chat_messages_update_all" ON chat_messages;
CREATE POLICY "chat_messages_update_authenticated" ON chat_messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "chat_messages_delete_all" ON chat_messages;
CREATE POLICY "chat_messages_delete_authenticated" ON chat_messages FOR DELETE TO authenticated
    USING (is_super_admin() OR sender_id = auth.uid());

-- RECEPTIONS: aislados por tenant
DROP POLICY IF EXISTS "receptions_select_all" ON receptions;
CREATE POLICY "receptions_select_authenticated" ON receptions FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "receptions_insert_all" ON receptions;
CREATE POLICY "receptions_insert_authenticated" ON receptions FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "receptions_update_all" ON receptions;
CREATE POLICY "receptions_update_authenticated" ON receptions FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "receptions_delete_all" ON receptions;
CREATE POLICY "receptions_delete_authenticated" ON receptions FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- QUICK_REPLIES: super_admin gestiona, todos leen
DROP POLICY IF EXISTS "quick_replies_select_all" ON quick_replies;
CREATE POLICY "quick_replies_select_authenticated" ON quick_replies FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "quick_replies_insert_all" ON quick_replies;
CREATE POLICY "quick_replies_insert_superadmin" ON quick_replies FOR INSERT TO authenticated
    WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "quick_replies_delete_all" ON quick_replies;
CREATE POLICY "quick_replies_delete_superadmin" ON quick_replies FOR DELETE TO authenticated
    USING (is_super_admin());

-- TASKS: aislados por tenant
CREATE POLICY "tasks_select_authenticated" ON tasks FOR SELECT TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_insert_authenticated" ON tasks FOR INSERT TO authenticated
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_update_authenticated" ON tasks FOR UPDATE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "tasks_delete_authenticated" ON tasks FOR DELETE TO authenticated
    USING (is_super_admin() OR tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid()));

-- BROADCAST_MESSAGES: todos los authenticated leen, solo super_admin escribe
CREATE POLICY "broadcast_select_all" ON broadcast_messages FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "broadcast_insert_superadmin" ON broadcast_messages FOR INSERT TO authenticated
    WITH CHECK (is_super_admin());

CREATE POLICY "broadcast_delete_superadmin" ON broadcast_messages FOR DELETE TO authenticated
    USING (is_super_admin());

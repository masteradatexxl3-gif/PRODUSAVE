/*
# PRODUSAVE - Esquema Multi-tenant Completo

## Resumen
Crea el esquema fundacional de PRODUSAVE: un sistema SaaS multi-tenant (marca blanca)
de gestión de stock, POS y administración de personal. Incluye negocios (tenants),
perfiles de usuarios con roles, categorías, productos, ventas con detalle,
fiados (cuentas corrientes) y chat en vivo.

## Tablas Nuevas

1. `tenants` — Negocios/comercios (multi-tenant / white-label)
   - `id` (uuid, PK)
   - `name` (text, nombre del negocio)
   - `slug` (text, identificador URL único)
   - `logo_url` (text, URL del logo)
   - `primary_color` (text, color principal de marca blanca, default '#5865F2')
   - `accent_color` (text, color de acento, default '#2f3136')
   - `logo_emoji` (text, emoji representativo del logo)
   - `status` (text, estado: active/suspended/trialing)
   - `created_at` (timestamptz)

2. `profiles` — Perfiles de usuario vinculados a auth.users con roles
   - `id` (uuid, PK, FK a auth.users)
   - `tenant_id` (uuid, FK a tenants, NULL para super_admin)
   - `name` (text, nombre del usuario)
   - `role` (text, super_admin/boss/employee)
   - `active` (boolean, default true)
   - `created_at` (timestamptz)

3. `categories` — Categorías de productos por negocio
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `name` (text, nombre de categoría)
   - `created_at` (timestamptz)
   - Restricción UNIQUE(tenant_id, name)

4. `products` — Inventario de productos
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `category_id` (uuid, FK a categories)
   - `name`, `brand`, `barcode`, `weight` (text)
   - `cost_price`, `sale_price` (numeric)
   - `stock` (int)
   - `min_stock` (int, umbral de alerta)
   - `created_at` (timestamptz)

5. `sales` — Cabecera de ventas
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `profile_id` (uuid, FK a profiles, quién cobró)
   - `total` (numeric)
   - `payment_method` (jsonb, estructura mixta)
   - `is_fiado` (boolean, venta al fiado)
   - `customer_name` (text)
   - `created_at` (timestamptz)

6. `sale_items` — Detalle de venta (preserva precio histórico)
   - `id` (uuid, PK)
   - `sale_id` (uuid, FK a sales)
   - `product_id` (uuid, FK a products)
   - `quantity` (int)
   - `price_at_sale` (numeric, precio real cobrado)
   - `original_price` (numeric, precio original para detectar cambios)

7. `credits` — Fiados / cuentas corrientes
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `sale_id` (uuid, FK a sales)
   - `customer_name`, `customer_phone` (text)
   - `amount` (numeric)
   - `due_date` (date)
   - `status` (text, pending/paid/overdue)
   - `last_reminder_sent` (timestamptz)

8. `chat_messages` — Chat en vivo entre usuarios
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants, NULL para chat global de soporte)
   - `sender_id`, `receiver_id` (uuid, FK a profiles)
   - `message` (text)
   - `created_at` (timestamptz)

9. `receptions` — Recepción de mercadería (exclusivo del jefe)
   - `id` (uuid, PK)
   - `tenant_id` (uuid, FK a tenants)
   - `supplier`, `remito` (text)
   - `items` (jsonb, lista de artículos recibidos)
   - `total` (numeric)
   - `status` (text, received/pending)
   - `received_at` (timestamptz)

## Seguridad (RLS)
- RLS habilitado en TODAS las tablas.
- Políticas separadas por verbo CRUD (SELECT/INSERT/UPDATE/DELETE), nunca FOR ALL.
- Como la app aún no tiene pantalla de login, las políticas permiten `anon, authenticated`
  para que la SPA funcione. Cuando se agregue auth, se restringirán a `authenticated`
  con verificación de tenant_id via auth.uid().
- Función helper `is_super_admin()` para verificación de rol.

## Notas Importantes
1. Se usa `uuid-ossp` para generación de IDs seguros.
2. Los precios se guardan como NUMERIC(12,2) para precisión monetaria.
3. `sale_items` preserva precios históricos para auditoría ante remarcación masiva.
4. `payment_method` como JSONB soporta pagos mixtos (ej: {"cash":700,"qr":300}).
5. Las políticas actuales son permisivas (anon) porque la app no tiene auth todavía.
*/
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TENANTS
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#5865F2',
    accent_color TEXT DEFAULT '#2f3136',
    logo_emoji TEXT DEFAULT '🛒',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'boss', 'employee')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    weight TEXT,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SALES
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES profiles(id),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method JSONB NOT NULL,
    is_fiado BOOLEAN DEFAULT false,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SALE_ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_sale NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2) NOT NULL
);

-- 8. CREDITS
CREATE TABLE IF NOT EXISTS credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    last_reminder_sent TIMESTAMPTZ
);

-- 9. CHAT_MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id),
    receiver_id UUID NOT NULL REFERENCES profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RECEPTIONS
CREATE TABLE IF NOT EXISTS receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    supplier TEXT NOT NULL,
    remito TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('received', 'pending')),
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. QUICK_REPLIES (mensajes rápidos del super admin)
CREATE TABLE IF NOT EXISTS quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-------------------------------------------------------------------------------
-- HABILITAR RLS EN TODAS LAS TABLAS
-------------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quick_replies ENABLE ROW LEVEL SECURITY;

-------------------------------------------------------------------------------
-- FUNCIÓN HELPER
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-------------------------------------------------------------------------------
-- POLÍTICAS RLS
-- Como la app aún no tiene pantalla de login, usamos TO anon, authenticated
-- para que la SPA funcione. Cuando se agregue auth, se restringirán a
-- authenticated con verificación de tenant_id.
-------------------------------------------------------------------------------

-- TENANTS
DROP POLICY IF EXISTS "tenants_select_all" ON tenants;
CREATE POLICY "tenants_select_all" ON tenants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "tenants_insert_all" ON tenants;
CREATE POLICY "tenants_insert_all" ON tenants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "tenants_update_all" ON tenants;
CREATE POLICY "tenants_update_all" ON tenants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "tenants_delete_all" ON tenants;
CREATE POLICY "tenants_delete_all" ON tenants FOR DELETE TO anon, authenticated USING (true);

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
CREATE POLICY "profiles_delete_all" ON profiles FOR DELETE TO anon, authenticated USING (true);

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_all" ON categories;
CREATE POLICY "categories_select_all" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "categories_insert_all" ON categories;
CREATE POLICY "categories_insert_all" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "categories_update_all" ON categories;
CREATE POLICY "categories_update_all" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "categories_delete_all" ON categories;
CREATE POLICY "categories_delete_all" ON categories FOR DELETE TO anon, authenticated USING (true);

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_all" ON products;
CREATE POLICY "products_select_all" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "products_insert_all" ON products;
CREATE POLICY "products_insert_all" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "products_update_all" ON products;
CREATE POLICY "products_update_all" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "products_delete_all" ON products;
CREATE POLICY "products_delete_all" ON products FOR DELETE TO anon, authenticated USING (true);

-- SALES
DROP POLICY IF EXISTS "sales_select_all" ON sales;
CREATE POLICY "sales_select_all" ON sales FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sales_insert_all" ON sales;
CREATE POLICY "sales_insert_all" ON sales FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sales_update_all" ON sales;
CREATE POLICY "sales_update_all" ON sales FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sales_delete_all" ON sales;
CREATE POLICY "sales_delete_all" ON sales FOR DELETE TO anon, authenticated USING (true);

-- SALE_ITEMS
DROP POLICY IF EXISTS "sale_items_select_all" ON sale_items;
CREATE POLICY "sale_items_select_all" ON sale_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "sale_items_insert_all" ON sale_items;
CREATE POLICY "sale_items_insert_all" ON sale_items FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "sale_items_update_all" ON sale_items;
CREATE POLICY "sale_items_update_all" ON sale_items FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sale_items_delete_all" ON sale_items;
CREATE POLICY "sale_items_delete_all" ON sale_items FOR DELETE TO anon, authenticated USING (true);

-- CREDITS
DROP POLICY IF EXISTS "credits_select_all" ON credits;
CREATE POLICY "credits_select_all" ON credits FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "credits_insert_all" ON credits;
CREATE POLICY "credits_insert_all" ON credits FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "credits_update_all" ON credits;
CREATE POLICY "credits_update_all" ON credits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "credits_delete_all" ON credits;
CREATE POLICY "credits_delete_all" ON credits FOR DELETE TO anon, authenticated USING (true);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_select_all" ON chat_messages;
CREATE POLICY "chat_messages_select_all" ON chat_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "chat_messages_insert_all" ON chat_messages;
CREATE POLICY "chat_messages_insert_all" ON chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_update_all" ON chat_messages;
CREATE POLICY "chat_messages_update_all" ON chat_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "chat_messages_delete_all" ON chat_messages;
CREATE POLICY "chat_messages_delete_all" ON chat_messages FOR DELETE TO anon, authenticated USING (true);

-- RECEPTIONS
DROP POLICY IF EXISTS "receptions_select_all" ON receptions;
CREATE POLICY "receptions_select_all" ON receptions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "receptions_insert_all" ON receptions;
CREATE POLICY "receptions_insert_all" ON receptions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "receptions_update_all" ON receptions;
CREATE POLICY "receptions_update_all" ON receptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "receptions_delete_all" ON receptions;
CREATE POLICY "receptions_delete_all" ON receptions FOR DELETE TO anon, authenticated USING (true);

-- QUICK_REPLIES
DROP POLICY IF EXISTS "quick_replies_select_all" ON quick_replies;
CREATE POLICY "quick_replies_select_all" ON quick_replies FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "quick_replies_insert_all" ON quick_replies;
CREATE POLICY "quick_replies_insert_all" ON quick_replies FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "quick_replies_delete_all" ON quick_replies;
CREATE POLICY "quick_replies_delete_all" ON quick_replies FOR DELETE TO anon, authenticated USING (true);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_credits_tenant ON credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_receptions_tenant ON receptions(tenant_id);

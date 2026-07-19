-- ============================================================================
-- PRODUSAVE - ESQUEMA COMPLETO PARA SUPABASE (con fixes de seguridad)
-- ============================================================================
-- Este archivo contiene TODO el esquema de la base de datos para PRODUSAVE.
-- Ejecutalo en el SQL Editor de tu proyecto de Supabase.
-- Es seguro re-ejecutarlo (usa IF NOT EXISTS / IF EXISTS).
-- ============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE NEGOCIOS (Tenants / Marca Blanca)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#5865F2',
    accent_color TEXT DEFAULT '#2f3136',
    logo_emoji TEXT DEFAULT '🛒',
    status TEXT DEFAULT 'active',
    plan TEXT DEFAULT 'version_de_prueba',
    subscription_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERFILES DE USUARIOS (Roles vinculados a Auth de Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'boss', 'employee')),
    active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CATEGORÍAS DE PRODUCTOS
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- 5. PRODUCTOS / INVENTARIO (Bodega + Caja)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    brand TEXT,
    barcode TEXT,
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    weight TEXT,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    warehouse_stock INT NOT NULL DEFAULT 0,
    published_stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VENTAS (Cabecera)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method JSONB NOT NULL,
    is_fiado BOOLEAN DEFAULT false,
    customer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DETALLE DE VENTAS (Preserva precio histórico)
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    price_at_sale NUMERIC(12, 2) NOT NULL,
    original_price NUMERIC(12, 2) NOT NULL
);

-- 8. FIADOS (Cuentas Corrientes)
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    last_reminder_sent TIMESTAMPTZ
);

-- 9. CHAT EN VIVO
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RECEPCIÓN DE MERCADERÍA
CREATE TABLE IF NOT EXISTS public.receptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    supplier TEXT NOT NULL,
    remito TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'pending' CHECK (status IN ('received', 'pending')),
    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. MENSAJES RÁPIDOS (Quick Replies del Super Admin)
CREATE TABLE IF NOT EXISTS public.quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TAREAS DE REPOSICIÓN (Bodega → Caja)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. CANAL DE DIFUSIÓN (Solo Super Admin escribe)
CREATE TABLE IF NOT EXISTS public.broadcast_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. MOVIMIENTOS DE STOCK (Auditoría)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bodega_to_caja', 'reception', 'sale', 'adjustment')),
    quantity INT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CIERRES DE CAJA (X-Read / Z-Read)
CREATE TABLE IF NOT EXISTS public.cash_closes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id),
    type TEXT NOT NULL CHECK (type IN ('x_read', 'z_read')),
    opening_cash NUMERIC(12, 2) DEFAULT 0.00,
    counted_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    expected_cash NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    card_total NUMERIC(12, 2) DEFAULT 0.00,
    transfer_total NUMERIC(12, 2) DEFAULT 0.00,
    qr_total NUMERIC(12, 2) DEFAULT 0.00,
    difference NUMERIC(12, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_tenant ON public.sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_created ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_credits_tenant ON public.credits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credits_status ON public.credits(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_receptions_tenant ON public.receptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON public.tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_created ON public.broadcast_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_tenants_expires ON public.tenants(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON public.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_closes_tenant ON public.cash_closes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_closes_created ON public.cash_closes(created_at);

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FUNCIÓN HELPER: ¿Es Super Admin? (search_path fijo para seguridad)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

-- ============================================================================
-- TRIGGER: Crear perfil automáticamente al registrar usuario en Auth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, tenant_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'boss')::TEXT,
    NULL
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- POLÍTICAS RLS (authenticated estricto, aislamiento por tenant)
-- ============================================================================

-- TENANTS
DROP POLICY IF EXISTS "tenants_select_authenticated" ON public.tenants;
CREATE POLICY "tenants_select_authenticated" ON public.tenants FOR SELECT TO authenticated
    USING (public.is_super_admin() OR id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "tenants_insert_superadmin" ON public.tenants;
CREATE POLICY "tenants_insert_superadmin" ON public.tenants FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "tenants_update_authenticated" ON public.tenants;
CREATE POLICY "tenants_update_authenticated" ON public.tenants FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "tenants_delete_superadmin" ON public.tenants;
CREATE POLICY "tenants_delete_superadmin" ON public.tenants FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT TO authenticated
    USING (public.is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
CREATE POLICY "profiles_insert_authenticated" ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
CREATE POLICY "profiles_update_authenticated" ON public.profiles FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR id = auth.uid() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "profiles_delete_superadmin" ON public.profiles;
CREATE POLICY "profiles_delete_superadmin" ON public.profiles FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- CATEGORIES
DROP POLICY IF EXISTS "categories_select_authenticated" ON public.categories;
CREATE POLICY "categories_select_authenticated" ON public.categories FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "categories_insert_authenticated" ON public.categories;
CREATE POLICY "categories_insert_authenticated" ON public.categories FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "categories_update_authenticated" ON public.categories;
CREATE POLICY "categories_update_authenticated" ON public.categories FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "categories_delete_authenticated" ON public.categories;
CREATE POLICY "categories_delete_authenticated" ON public.categories FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_authenticated" ON public.products;
CREATE POLICY "products_select_authenticated" ON public.products FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "products_insert_authenticated" ON public.products;
CREATE POLICY "products_insert_authenticated" ON public.products FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "products_update_authenticated" ON public.products;
CREATE POLICY "products_update_authenticated" ON public.products FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "products_delete_authenticated" ON public.products;
CREATE POLICY "products_delete_authenticated" ON public.products FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- SALES
DROP POLICY IF EXISTS "sales_select_authenticated" ON public.sales;
CREATE POLICY "sales_select_authenticated" ON public.sales FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "sales_insert_authenticated" ON public.sales;
CREATE POLICY "sales_insert_authenticated" ON public.sales FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "sales_update_authenticated" ON public.sales;
CREATE POLICY "sales_update_authenticated" ON public.sales FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "sales_delete_authenticated" ON public.sales;
CREATE POLICY "sales_delete_authenticated" ON public.sales FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- SALE_ITEMS
DROP POLICY IF EXISTS "sale_items_select_authenticated" ON public.sale_items;
CREATE POLICY "sale_items_select_authenticated" ON public.sale_items FOR SELECT TO authenticated
    USING (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));
DROP POLICY IF EXISTS "sale_items_insert_authenticated" ON public.sale_items;
CREATE POLICY "sale_items_insert_authenticated" ON public.sale_items FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR EXISTS (SELECT 1 FROM public.sales WHERE public.sales.id = public.sale_items.sale_id AND public.sales.tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())));
DROP POLICY IF EXISTS "sale_items_delete_authenticated" ON public.sale_items;
CREATE POLICY "sale_items_delete_authenticated" ON public.sale_items FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- CREDITS
DROP POLICY IF EXISTS "credits_select_authenticated" ON public.credits;
CREATE POLICY "credits_select_authenticated" ON public.credits FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "credits_insert_authenticated" ON public.credits;
CREATE POLICY "credits_insert_authenticated" ON public.credits FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "credits_update_authenticated" ON public.credits;
CREATE POLICY "credits_update_authenticated" ON public.credits FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "credits_delete_authenticated" ON public.credits;
CREATE POLICY "credits_delete_authenticated" ON public.credits FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "chat_messages_select_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_select_authenticated" ON public.chat_messages FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id IS NULL OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()) OR sender_id = auth.uid() OR receiver_id = auth.uid());
DROP POLICY IF EXISTS "chat_messages_insert_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_insert_authenticated" ON public.chat_messages FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR sender_id = auth.uid() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "chat_messages_update_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_update_authenticated" ON public.chat_messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid());
DROP POLICY IF EXISTS "chat_messages_delete_authenticated" ON public.chat_messages;
CREATE POLICY "chat_messages_delete_authenticated" ON public.chat_messages FOR DELETE TO authenticated
    USING (public.is_super_admin() OR sender_id = auth.uid());

-- RECEPTIONS
DROP POLICY IF EXISTS "receptions_select_authenticated" ON public.receptions;
CREATE POLICY "receptions_select_authenticated" ON public.receptions FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "receptions_insert_authenticated" ON public.receptions;
CREATE POLICY "receptions_insert_authenticated" ON public.receptions FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "receptions_update_authenticated" ON public.receptions;
CREATE POLICY "receptions_update_authenticated" ON public.receptions FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "receptions_delete_authenticated" ON public.receptions;
CREATE POLICY "receptions_delete_authenticated" ON public.receptions FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- QUICK_REPLIES (todos leen, solo super_admin escribe)
DROP POLICY IF EXISTS "quick_replies_select_authenticated" ON public.quick_replies;
CREATE POLICY "quick_replies_select_authenticated" ON public.quick_replies FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "quick_replies_insert_superadmin" ON public.quick_replies;
CREATE POLICY "quick_replies_insert_superadmin" ON public.quick_replies FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "quick_replies_delete_superadmin" ON public.quick_replies;
CREATE POLICY "quick_replies_delete_superadmin" ON public.quick_replies FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- TASKS
DROP POLICY IF EXISTS "tasks_select_authenticated" ON public.tasks;
CREATE POLICY "tasks_select_authenticated" ON public.tasks FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "tasks_insert_authenticated" ON public.tasks;
CREATE POLICY "tasks_insert_authenticated" ON public.tasks FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "tasks_update_authenticated" ON public.tasks;
CREATE POLICY "tasks_update_authenticated" ON public.tasks FOR UPDATE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "tasks_delete_authenticated" ON public.tasks;
CREATE POLICY "tasks_delete_authenticated" ON public.tasks FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- BROADCAST_MESSAGES (todos leen, solo super_admin escribe)
DROP POLICY IF EXISTS "broadcast_select_all" ON public.broadcast_messages;
CREATE POLICY "broadcast_select_all" ON public.broadcast_messages FOR SELECT TO authenticated
    USING (true);
DROP POLICY IF EXISTS "broadcast_insert_superadmin" ON public.broadcast_messages;
CREATE POLICY "broadcast_insert_superadmin" ON public.broadcast_messages FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin());
DROP POLICY IF EXISTS "broadcast_delete_superadmin" ON public.broadcast_messages;
CREATE POLICY "broadcast_delete_superadmin" ON public.broadcast_messages FOR DELETE TO authenticated
    USING (public.is_super_admin());

-- STOCK_MOVEMENTS
DROP POLICY IF EXISTS "stock_movements_select_authenticated" ON public.stock_movements;
CREATE POLICY "stock_movements_select_authenticated" ON public.stock_movements FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "stock_movements_insert_authenticated" ON public.stock_movements;
CREATE POLICY "stock_movements_insert_authenticated" ON public.stock_movements FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "stock_movements_delete_authenticated" ON public.stock_movements;
CREATE POLICY "stock_movements_delete_authenticated" ON public.stock_movements FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- CASH_CLOSES
DROP POLICY IF EXISTS "cash_closes_select_authenticated" ON public.cash_closes;
CREATE POLICY "cash_closes_select_authenticated" ON public.cash_closes FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "cash_closes_insert_authenticated" ON public.cash_closes;
CREATE POLICY "cash_closes_insert_authenticated" ON public.cash_closes FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
DROP POLICY IF EXISTS "cash_closes_delete_authenticated" ON public.cash_closes;
CREATE POLICY "cash_closes_delete_authenticated" ON public.cash_closes FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================================
-- FIXES DE SEGURIDAD: Revocar privilegios de anon en todas las tablas
-- ============================================================================
-- Esto previene que las tablas sean visibles en el GraphQL schema sin autenticación
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.tenants FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.categories FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.products FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.sale_items FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.credits FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.receptions FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.quick_replies FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.broadcast_messages FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.stock_movements FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE public.cash_closes FROM anon;

-- ============================================================================
-- FIXES DE SEGURIDAD: Revocar EXECUTE de funciones SECURITY DEFINER
-- ============================================================================
-- Revocar EXECUTE de PUBLIC en todas las funciones SECURITY DEFINER.
-- PUBLIC (grantee 0) hereda a anon y authenticated, por lo que revocar
-- solo de esos roles no sirve si PUBLIC mantiene el grant.
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- is_super_admin() la llaman las políticas RLS, que corren como el caller.
-- Solo authenticated necesita ejecutarla.
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- handle_new_user() es un trigger disparado por el rol de servicio.
-- Ningún rol de app (anon ni authenticated) debería llamarla vía RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- rls_auto_enable() es una utilidad de administración.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- Revocar privilegios de anon en Storage
REVOKE INSERT ON storage.objects FROM anon;

-- ============================================================================
-- STORAGE BUCKET PARA LOGOS DE MARCA BLANCA
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "logos_upload_authenticated" ON storage.objects;
CREATE POLICY "logos_upload_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'logos');
DROP POLICY IF EXISTS "logos_read_public" ON storage.objects;
CREATE POLICY "logos_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');
DROP POLICY IF EXISTS "logos_delete_owner" ON storage.objects;
CREATE POLICY "logos_delete_owner" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'logos' AND owner = auth.uid());

-- ============================================================================
-- DATOS DE EJEMPLO (Seed)
-- ============================================================================
INSERT INTO public.tenants (id, name, slug, primary_color, accent_color, logo_emoji, status, plan, subscription_expires_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'Almacén Don Carlos', 'don-carlos', '#D97706', '#F59E0B', '🛒', 'active', 'pro', NOW() + INTERVAL '25 days'),
('a0000000-0000-0000-0000-000000000002', 'Fiambrería La Esmeralda', 'la-esmeralda', '#059669', '#10B981', '🧀', 'active', 'version_de_prueba', NOW() + INTERVAL '7 days'),
('a0000000-0000-0000-0000-000000000003', 'Verdulería El Sol', 'el-sol', '#DC2626', '#EF4444', '🥕', 'suspended', 'enterprise', NOW() + INTERVAL '3 days')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.categories (id, tenant_id, name) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Almacén'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Bebidas'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Limpieza'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Frescos'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Fiambres')
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO public.products (id, tenant_id, category_id, name, brand, barcode, cost_price, sale_price, weight, stock, min_stock, warehouse_stock, published_stock) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Harina 000 Leche 1kg', 'Blancaflor', '7791234567890', 850, 1290, '1kg', 42, 10, 20, 22),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Aceite Girasol 1.5L', 'Cocinero', '7792345678901', 2100, 3450, '1.5L', 18, 8, 12, 6),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Arroz Largo Fino 500g', 'Gallo', '7793456789012', 690, 1150, '500g', 7, 12, 15, 7),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Fideos Spaghetti 500g', 'Matarazzo', '7794567890123', 720, 1180, '500g', 55, 15, 30, 25),
('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Azúcar Refined 1kg', 'Ledesma', '7795678901234', 980, 1490, '1kg', 30, 10, 10, 20),
('c0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Yerba Mate Despalada 1kg', 'Taragüi', '7796789012345', 1450, 2390, '1kg', 24, 10, 14, 10),
('c0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Coca-Cola 2.25L', 'Coca-Cola', '7797890123456', 1890, 2990, '2.25L', 36, 12, 24, 12),
('c0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Agua Saborizada Sprite 1.5L', 'Sprite', '7798901234567', 1290, 1990, '1.5L', 4, 10, 8, 4),
('c0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'Vino Toro Malbec 750ml', 'Toro Viejo', '7799012345678', 1450, 2690, '750ml', 20, 6, 10, 10),
('c0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Lavandina 1L', 'Ayudín', '7790123456789', 590, 990, '1L', 28, 8, 18, 10),
('c0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Jabón Líquido 500ml', 'Skip', '7791123456780', 1290, 2190, '500ml', 9, 5, 6, 3),
('c0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Leche Entera 1L', 'La Serenísima', '7792234567801', 990, 1590, '1L', 5, 15, 3, 5),
('c0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Huevos Docena', 'Granja del Sol', '7793345678012', 1890, 2990, '12u', 12, 6, 8, 4),
('c0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Queso Cremoso x Kg', 'La Paulina', '7794456780123', 4500, 7900, '1kg', 8, 4, 5, 3),
('c0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Jamón Cocido Fetas 250g', 'Paladini', '7795567801234', 2390, 3890, '250g', 3, 6, 4, 3),
('c0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'Salchichas Viena 500g', 'Paladini', '7796678012345', 1690, 2790, '500g', 14, 6, 8, 6),
('c0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Pan Lactal Lacteo 500g', 'Bimbo', '7797780123456', 1190, 1890, '500g', 22, 10, 12, 10),
('c0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Galletas Dulces 300g', 'Bagley', '7798890123457', 890, 1490, '300g', 6, 10, 8, 6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.quick_replies (text) VALUES
('Hola, me comunico de la gestión de Produsave...'),
('Tu suscripción está activa nuevamente. Gracias!'),
('¿Podés enviarme el comprobante de pago?'),
('Vamos a programar una actualización del sistema esta noche.'),
('Recibido, lo reviso y te confirmo a la brevedad.')
ON CONFLICT DO NOTHING;

INSERT INTO public.broadcast_messages (title, message) VALUES
('Bienvenidos a Produsave', 'Recordamos a todos los comercios que el soporte está disponible de lunes a viernes de 9 a 18 hs. ¡Gracias por confiar en nosotros!'),
('Mantenimiento programado', 'El próximo domingo de 2 a 4 AM se realizará mantenimiento del sistema. Puede haber interrupciones breves.')
ON CONFLICT DO NOTHING;

INSERT INTO public.receptions (tenant_id, supplier, remito, items, total, status) VALUES
('a0000000-0000-0000-0000-000000000001', 'Distribuidora Norte SA', 'R-2026-0451', '[{"name":"Coca-Cola 2.25L","qty":24,"cost":1890},{"name":"Sprite 1.5L","qty":12,"cost":1290}]'::jsonb, 60480, 'received'),
('a0000000-0000-0000-0000-000000000001', 'Fideos del Sur', 'R-2026-0452', '[{"name":"Fideos Spaghetti 500g","qty":40,"cost":720}]'::jsonb, 28800, 'received'),
('a0000000-0000-0000-0000-000000000001', 'Lácteos La Plata', 'R-2026-0453', '[{"name":"Leche Entera 1L","qty":30,"cost":990},{"name":"Queso Cremoso x Kg","qty":10,"cost":4500}]'::jsonb, 74700, 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LISTO. Esquema completo de PRODUSAVE aplicado con fixes de seguridad.
-- ============================================================================

-- ============================================================================
-- PRODUSAVE - FIXES DE SEGURIDAD
-- ============================================================================

-- 1. FIX: Function search_path mutable en is_super_admin()
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

-- 2. FIX: handle_new_user con search_path explícito
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

-- 3. Crear tablas faltantes (stock_movements y cash_closes)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('bodega_to_caja', 'reception', 'sale', 'adjustment')),
    quantity INT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_closes (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
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

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_closes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON public.stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_cash_closes_tenant ON public.cash_closes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_closes_created ON public.cash_closes(created_at);

-- RLS policies for stock_movements
CREATE POLICY "stock_movements_select_authenticated" ON public.stock_movements FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "stock_movements_insert_authenticated" ON public.stock_movements FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "stock_movements_delete_authenticated" ON public.stock_movements FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- RLS policies for cash_closes
CREATE POLICY "cash_closes_select_authenticated" ON public.cash_closes FOR SELECT TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "cash_closes_insert_authenticated" ON public.cash_closes FOR INSERT TO authenticated
    WITH CHECK (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));
CREATE POLICY "cash_closes_delete_authenticated" ON public.cash_closes FOR DELETE TO authenticated
    USING (public.is_super_admin() OR tenant_id = (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()));

-- 4. FIX: Revocar TODOS los privilegios de anon en todas las tablas
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

-- 5. FIX: Revocar EXECUTE de anon en funciones SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- 6. FIX: Revocar EXECUTE de anon Y authenticated en rls_auto_enable (si existe)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace) THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
  END IF;
END $$;

-- 7. FIX: Revocar EXECUTE de authenticated en handle_new_user (trigger interno)
-- Solo el rol de servicio (postgres/supabase_admin) debería ejecutarla
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- 8. Asegurar que is_super_admin() solo sea ejecutable por authenticated
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- 9. FIX: Revocar privilegios de anon en Storage
REVOKE INSERT ON storage.objects FROM anon;

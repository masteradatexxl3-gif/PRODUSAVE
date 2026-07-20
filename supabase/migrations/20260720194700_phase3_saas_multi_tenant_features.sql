/*
# Phase 3: SaaS Multi-Tenant Features (fixed)

Adds: discount_coupons, audit_logs, employee_permissions tables.
Adds columns: sales.mixed_amounts, sales.customer_name, sales.coupon_id, sales.discount_amount, tenants.trial_days.
Adds pg_trgm extension + GIN indexes for fuzzy search.
Re-applies profiles RLS policies and is_super_admin function.
*/

CREATE EXTENSION IF NOT EXISTS pg_trgm;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='mixed_amounts') THEN
    ALTER TABLE public.sales ADD COLUMN mixed_amounts JSONB;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_name') THEN
    ALTER TABLE public.sales ADD COLUMN customer_name TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='trial_days') THEN
    ALTER TABLE public.tenants ADD COLUMN trial_days INT NOT NULL DEFAULT 14;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_discount_coupons_tenant ON public.discount_coupons(tenant_id);

DROP POLICY IF EXISTS "select_own_coupons" ON public.discount_coupons;
CREATE POLICY "select_own_coupons" ON public.discount_coupons FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR tenant_id = discount_coupons.tenant_id))
  );
DROP POLICY IF EXISTS "insert_own_coupons" ON public.discount_coupons;
CREATE POLICY "insert_own_coupons" ON public.discount_coupons FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = discount_coupons.tenant_id)))
  );
DROP POLICY IF EXISTS "update_own_coupons" ON public.discount_coupons;
CREATE POLICY "update_own_coupons" ON public.discount_coupons FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = discount_coupons.tenant_id)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = discount_coupons.tenant_id)))
  );
DROP POLICY IF EXISTS "delete_own_coupons" ON public.discount_coupons;
CREATE POLICY "delete_own_coupons" ON public.discount_coupons FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = discount_coupons.tenant_id)))
  );

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

DROP POLICY IF EXISTS "select_own_audit" ON public.audit_logs;
CREATE POLICY "select_own_audit" ON public.audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR tenant_id = audit_logs.tenant_id))
  );
DROP POLICY IF EXISTS "insert_own_audit" ON public.audit_logs;
CREATE POLICY "insert_own_audit" ON public.audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role IN ('super_admin','boss','employee') AND tenant_id = audit_logs.tenant_id))
  );

CREATE TABLE IF NOT EXISTS public.employee_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_discount BOOLEAN NOT NULL DEFAULT false,
  can_see_cost BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, profile_id)
);
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_emp_perms_tenant ON public.employee_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_emp_perms_profile ON public.employee_permissions(profile_id);

DROP POLICY IF EXISTS "select_own_empperms" ON public.employee_permissions;
CREATE POLICY "select_own_empperms" ON public.employee_permissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR tenant_id = employee_permissions.tenant_id))
  );
DROP POLICY IF EXISTS "insert_own_empperms" ON public.employee_permissions;
CREATE POLICY "insert_own_empperms" ON public.employee_permissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = employee_permissions.tenant_id)))
  );
DROP POLICY IF EXISTS "update_own_empperms" ON public.employee_permissions;
CREATE POLICY "update_own_empperms" ON public.employee_permissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = employee_permissions.tenant_id)))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = employee_permissions.tenant_id)))
  );
DROP POLICY IF EXISTS "delete_own_empperms" ON public.employee_permissions;
CREATE POLICY "delete_own_empperms" ON public.employee_permissions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'super_admin' OR (role = 'boss' AND tenant_id = employee_permissions.tenant_id)))
  );

CREATE INDEX IF NOT EXISTS idx_tenants_name_trgm ON public.tenants USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING GIN (name gin_trgm_ops);

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "allow_authenticated_read_profiles"
ON public.profiles FOR SELECT
TO authenticated USING (true);

CREATE POLICY "allow_individual_update_profiles"
ON public.profiles FOR UPDATE
TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

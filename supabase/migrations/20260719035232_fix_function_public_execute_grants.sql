-- ============================================================================
-- FIX: Functions still executable by PUBLIC (override on anon/authenticated revokes)
-- ============================================================================

-- Revoke EXECUTE from PUBLIC on all three SECURITY DEFINER functions.
-- PUBLIC grants override per-role revokes, so this is the actual fix.
REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;

-- is_super_admin() is called by RLS policies, which run as the caller.
-- Grant EXECUTE only to authenticated (the only role that should invoke it).
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- handle_new_user() is a trigger function fired by the auth service role.
-- No app role (anon or authenticated) should call it via RPC.
-- No grant needed — service roles bypass ACLs.

-- rls_auto_enable() is an admin utility. No app role should call it.
-- No grant needed.

-- Belt-and-suspenders: also drop any residual per-role grants we don't want.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

-- ============================================================
-- Role management for /admin/users
--
-- Before this migration the only UPDATE policy on profiles was
-- "auth.uid() = id", which let every user rewrite their own row,
-- including `role` (self-promotion to admin). This migration:
--   1. lets admins update any profile (to change roles), and
--   2. blocks role changes by anyone who is not an admin.
-- ============================================================

-- SECURITY DEFINER so the check can read profiles without recursing into RLS
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role = 'admin')
$$;

DROP POLICY IF EXISTS "Admins actualizan cualquier perfil" ON public.profiles;
CREATE POLICY "Admins actualizan cualquier perfil" ON public.profiles
  FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() is NULL for the service role / SQL editor, which stay allowed
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar roles';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

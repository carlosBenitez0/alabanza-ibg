-- ============================================================
-- Only three roles: admin, singer and musician
--
--   1. Former leaders become singers (an admin can change them later).
--   2. profiles.role no longer accepts 'leader'.
--   3. is_leader() now means "is admin", so every policy and trigger
--      that used it keeps working without being rewritten.
--   4. Instruments are assigned by an admin, like the role: members
--      can't change their own anymore.
-- ============================================================

-- auth.uid() is NULL in the SQL editor, so trg_prevent_role_escalation allows this
UPDATE public.profiles SET role = 'singer' WHERE role = 'leader';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('singer', 'musician', 'admin'));

CREATE OR REPLACE FUNCTION public.is_leader(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(uid)
$$;

CREATE OR REPLACE FUNCTION public.prevent_instrument_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.instruments IS DISTINCT FROM OLD.instruments
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Solo un administrador puede asignar instrumentos';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_instrument_change ON public.profiles;
CREATE TRIGGER trg_prevent_instrument_change
  BEFORE UPDATE OF instruments ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_instrument_change();

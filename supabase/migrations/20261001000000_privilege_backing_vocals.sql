-- ============================================================
-- Backing vocals (coristas) inside a singer's privilege
--
-- Requires 20260930000000_permissions_and_notifications.sql (public.is_leader).
--   1. A member can be a backing vocal in someone else's singing privilege.
--      The role is per privilege: profiles.role does not change.
--   2. They can join by themselves, or the privilege owner (or a leader)
--      can add them. The same people can remove them.
--   3. Joining or being added creates an in-app notification.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.privilege_backing_vocals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privilege_id UUID NOT NULL REFERENCES public.weekly_privileges(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (privilege_id, profile_id)
);

CREATE INDEX IF NOT EXISTS privilege_backing_vocals_profile_idx ON public.privilege_backing_vocals (profile_id);

ALTER TABLE public.privilege_backing_vocals ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_privilege_owner(priv UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.weekly_privileges WHERE id = priv AND profile_id = uid)
$$;

DROP POLICY IF EXISTS "Lectura pública de coristas" ON public.privilege_backing_vocals;
DROP POLICY IF EXISTS "Unirse o añadir coristas" ON public.privilege_backing_vocals;
DROP POLICY IF EXISTS "Salir o quitar coristas" ON public.privilege_backing_vocals;

CREATE POLICY "Lectura pública de coristas" ON public.privilege_backing_vocals
  FOR SELECT USING (true);

CREATE POLICY "Unirse o añadir coristas" ON public.privilege_backing_vocals
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      profile_id = auth.uid()
      OR public.is_privilege_owner(privilege_id, auth.uid())
      OR public.is_leader(auth.uid())
    )
  );

CREATE POLICY "Salir o quitar coristas" ON public.privilege_backing_vocals
  FOR DELETE USING (
    profile_id = auth.uid()
    OR public.is_privilege_owner(privilege_id, auth.uid())
    OR public.is_leader(auth.uid())
  );

-- Only singing privileges take backing vocals, and never the owner themselves
CREATE OR REPLACE FUNCTION public.validate_backing_vocal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  priv RECORD;
BEGIN
  SELECT profile_id, privilege_key INTO priv FROM public.weekly_privileges WHERE id = NEW.privilege_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'El privilegio no existe';
  END IF;
  IF priv.privilege_key NOT IN ('saturday_musician', 'sunday_lead_vocal') THEN
    RAISE EXCEPTION 'Solo los privilegios de cantar alabanzas admiten coristas';
  END IF;
  IF priv.profile_id = NEW.profile_id THEN
    RAISE EXCEPTION 'No puedes ser corista de tu propio privilegio';
  END IF;
  -- Record who really made the change, whatever the client sent
  NEW.added_by := COALESCE(auth.uid(), NEW.added_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_backing_vocal ON public.privilege_backing_vocals;
CREATE TRIGGER trg_validate_backing_vocal
  BEFORE INSERT ON public.privilege_backing_vocals
  FOR EACH ROW EXECUTE FUNCTION public.validate_backing_vocal();

-- In-app notification: the backing vocal when someone else added them,
-- the privilege owner when a member joined on their own
CREATE OR REPLACE FUNCTION public.notify_backing_vocal_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  priv RECORD;
  recipient UUID;
  actor_name TEXT;
  day_label TEXT;
  wants_in_app BOOLEAN;
BEGIN
  SELECT profile_id, privilege_key, assigned_date INTO priv
    FROM public.weekly_privileges WHERE id = NEW.privilege_id;

  recipient := CASE WHEN NEW.added_by = NEW.profile_id THEN priv.profile_id ELSE NEW.profile_id END;
  IF recipient IS NULL OR recipient = NEW.added_by THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(push_enabled, true) INTO wants_in_app
    FROM public.notification_preferences WHERE profile_id = recipient;
  IF wants_in_app IS FALSE THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(full_name, 'Un miembro') INTO actor_name FROM public.profiles WHERE id = NEW.added_by;
  day_label := CASE WHEN priv.privilege_key = 'saturday_musician' THEN 'sábado' ELSE 'domingo' END;

  INSERT INTO public.notifications (profile_id, type, title, message, data)
  VALUES (
    recipient,
    'backing_vocal',
    CASE WHEN NEW.added_by = NEW.profile_id THEN 'Nueva corista' ELSE 'Te añadieron como corista' END,
    CASE WHEN NEW.added_by = NEW.profile_id
      THEN format('%s se unió como corista a tu privilegio del %s %s.',
                  COALESCE(actor_name, 'Un miembro'), day_label, to_char(priv.assigned_date, 'DD/MM'))
      ELSE format('%s te añadió como corista para el %s %s.',
                  COALESCE(actor_name, 'Un miembro'), day_label, to_char(priv.assigned_date, 'DD/MM'))
    END,
    jsonb_build_object('privilege_id', NEW.privilege_id, 'assigned_date', priv.assigned_date)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_backing_vocal_added ON public.privilege_backing_vocals;
CREATE TRIGGER trg_notify_backing_vocal_added
  AFTER INSERT ON public.privilege_backing_vocals
  FOR EACH ROW EXECUTE FUNCTION public.notify_backing_vocal_added();

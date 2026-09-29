-- ============================================================
-- Permissions for events/assignments + in-app notifications
--
-- Requires 20260929000000_admin_role_management.sql (public.is_admin).
--   1. Only leaders/admins manage events and assignments; members may
--      only confirm or decline their own assignment.
--   2. Drops the placeholder email triggers (they POSTed to
--      https://TU_APP.vercel.app without a session on every insert;
--      the app already calls /api/notifications itself).
--   3. New assignments create an in-app notification for the member.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_leader(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = uid AND role IN ('leader', 'admin'))
$$;

-- ---------- events ----------
DROP POLICY IF EXISTS "Usuarios autenticados crean eventos" ON public.events;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan eventos" ON public.events;
DROP POLICY IF EXISTS "Usuarios autenticados eliminan eventos" ON public.events;
DROP POLICY IF EXISTS "Líderes crean eventos" ON public.events;
DROP POLICY IF EXISTS "Líderes actualizan eventos" ON public.events;
DROP POLICY IF EXISTS "Líderes eliminan eventos" ON public.events;

CREATE POLICY "Líderes crean eventos" ON public.events
  FOR INSERT WITH CHECK (public.is_leader(auth.uid()));
CREATE POLICY "Líderes actualizan eventos" ON public.events
  FOR UPDATE USING (public.is_leader(auth.uid())) WITH CHECK (public.is_leader(auth.uid()));
CREATE POLICY "Líderes eliminan eventos" ON public.events
  FOR DELETE USING (public.is_leader(auth.uid()));

-- ---------- event_assignments ----------
DROP POLICY IF EXISTS "Usuarios autenticados crean asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Usuarios autenticados actualizan asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Usuarios autenticados eliminan asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Líderes crean asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Líderes o el miembro actualizan asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Líderes eliminan asignaciones" ON public.event_assignments;

CREATE POLICY "Líderes crean asignaciones" ON public.event_assignments
  FOR INSERT WITH CHECK (public.is_leader(auth.uid()));
CREATE POLICY "Líderes o el miembro actualizan asignaciones" ON public.event_assignments
  FOR UPDATE
  USING (public.is_leader(auth.uid()) OR profile_id = auth.uid())
  WITH CHECK (public.is_leader(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "Líderes eliminan asignaciones" ON public.event_assignments
  FOR DELETE USING (public.is_leader(auth.uid()));

-- Members may only change the response fields of their own assignment
CREATE OR REPLACE FUNCTION public.restrict_assignment_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NOT public.is_leader(auth.uid())
     AND (NEW.event_id IS DISTINCT FROM OLD.event_id
          OR NEW.profile_id IS DISTINCT FROM OLD.profile_id
          OR NEW.role IS DISTINCT FROM OLD.role
          OR NEW.assigned_at IS DISTINCT FROM OLD.assigned_at) THEN
    RAISE EXCEPTION 'Solo puedes confirmar o rechazar tu asignación';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_assignment_self_update ON public.event_assignments;
CREATE TRIGGER trg_restrict_assignment_self_update
  BEFORE UPDATE ON public.event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.restrict_assignment_self_update();

-- ---------- broken email triggers ----------
DROP TRIGGER IF EXISTS trg_notify_new_song ON public.songs;
DROP TRIGGER IF EXISTS trg_notify_new_privilege ON public.weekly_privileges;
DROP FUNCTION IF EXISTS public.notify_new_song();
DROP FUNCTION IF EXISTS public.notify_new_privilege();

-- ---------- in-app notification on new assignment ----------
CREATE OR REPLACE FUNCTION public.notify_assignment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ev RECORD;
  role_label TEXT;
  wants_in_app BOOLEAN;
BEGIN
  SELECT COALESCE(push_enabled, true) INTO wants_in_app
    FROM public.notification_preferences WHERE profile_id = NEW.profile_id;
  IF wants_in_app IS FALSE THEN
    RETURN NEW;
  END IF;

  SELECT title, date INTO ev FROM public.events WHERE id = NEW.event_id;
  role_label := CASE NEW.role
    WHEN 'lead_vocal' THEN 'Voz Principal'
    WHEN 'choir' THEN 'Coro'
    WHEN 'musician' THEN 'Músico'
    WHEN 'sound' THEN 'Sonido'
    WHEN 'media' THEN 'Multimedia'
    ELSE NEW.role
  END;

  INSERT INTO public.notifications (profile_id, type, title, message, data)
  VALUES (
    NEW.profile_id,
    'assignment',
    'Nueva asignación',
    format('Te asignaron como %s en "%s" (%s). Confirma si puedes participar.',
           role_label, COALESCE(ev.title, 'un evento'), to_char(ev.date, 'DD/MM/YYYY')),
    jsonb_build_object('event_id', NEW.event_id, 'assignment_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_assignment_created ON public.event_assignments;
CREATE TRIGGER trg_notify_assignment_created
  AFTER INSERT ON public.event_assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_created();

-- Live unread badge (Supabase Realtime) — ignore the error if already added
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object OR undefined_object THEN
  NULL;
END $$;

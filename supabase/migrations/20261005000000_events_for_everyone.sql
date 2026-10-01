-- ============================================================
-- Special events are for the whole team
--
--   1. Any member creates events (always in their own name).
--   2. The creator and the admin edit or delete them.
--   3. Any member signs themselves up for an event, or leaves it;
--      the admin still assigns and removes anyone.
--   4. Signing yourself up doesn't send you a "Nueva asignación" notice.
-- ============================================================

-- ---------- events ----------
DROP POLICY IF EXISTS "Líderes crean eventos" ON public.events;
DROP POLICY IF EXISTS "Líderes actualizan eventos" ON public.events;
DROP POLICY IF EXISTS "Líderes eliminan eventos" ON public.events;
DROP POLICY IF EXISTS "Miembros crean eventos" ON public.events;
DROP POLICY IF EXISTS "Autor o admin actualizan eventos" ON public.events;
DROP POLICY IF EXISTS "Autor o admin eliminan eventos" ON public.events;

CREATE POLICY "Miembros crean eventos" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());
CREATE POLICY "Autor o admin actualizan eventos" ON public.events
  FOR UPDATE
  USING (public.is_admin(auth.uid()) OR created_by = auth.uid())
  WITH CHECK (public.is_admin(auth.uid()) OR created_by = auth.uid());
CREATE POLICY "Autor o admin eliminan eventos" ON public.events
  FOR DELETE USING (public.is_admin(auth.uid()) OR created_by = auth.uid());

-- ---------- event_assignments ----------
DROP POLICY IF EXISTS "Líderes crean asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Líderes eliminan asignaciones" ON public.event_assignments;
DROP POLICY IF EXISTS "Admin asigna o el miembro se apunta" ON public.event_assignments;
DROP POLICY IF EXISTS "Admin quita o el miembro se sale" ON public.event_assignments;

CREATE POLICY "Admin asigna o el miembro se apunta" ON public.event_assignments
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()) OR profile_id = auth.uid());
CREATE POLICY "Admin quita o el miembro se sale" ON public.event_assignments
  FOR DELETE USING (public.is_admin(auth.uid()) OR profile_id = auth.uid());

-- ---------- notices ----------
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
  -- Signed themselves up: nothing to tell them
  IF NEW.profile_id = auth.uid() THEN
    RETURN NEW;
  END IF;

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

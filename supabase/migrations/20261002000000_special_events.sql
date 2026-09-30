-- ============================================================
-- Events are special invitations, not regular services
--
-- Weekly services and rehearsals live in weekly_privileges. Events are
-- occasions where the team is invited to play: camps, joint events with
-- several churches (e.g. a thanksgiving service), invitations from
-- another church.
--   1. New event types: camp, united, invitation, other. Rows with the
--      old types (service, saturday, rehearsal) become "other".
--   2. New fields: organizer (host church), end_date (multi-day camps),
--      arrival_time (arrival / sound check) and songs (repertoire,
--      same shape as weekly_privileges.songs).
-- ============================================================

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_type_check;

UPDATE public.events
  SET event_type = 'other'
  WHERE event_type NOT IN ('camp', 'united', 'invitation', 'other');

ALTER TABLE public.events
  ADD CONSTRAINT events_event_type_check
  CHECK (event_type IN ('camp', 'united', 'invitation', 'other'));

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS organizer TEXT,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS arrival_time TIME,
  ADD COLUMN IF NOT EXISTS songs JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_end_date_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_end_date_check CHECK (end_date IS NULL OR end_date >= date);

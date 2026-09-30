-- ============================================================
-- Musician role + instruments
--
--   1. profiles.role accepts 'musician'. Only admins change roles
--      (trg_prevent_role_escalation from 20260929000000 still applies).
--   2. profiles.instruments: what a musician plays. Each member edits
--      their own (the existing "auth.uid() = id" update policy).
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('singer', 'musician', 'leader', 'admin'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instruments TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_instruments_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_instruments_check
  CHECK (instruments <@ ARRAY['guitar', 'drums', 'trumpet', 'piano', 'bass']::TEXT[]);

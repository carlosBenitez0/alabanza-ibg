-- ============================================================
-- ALABANZA IBG: RESTAURACIÓN COMPLETA DEL ESQUEMA
-- ============================================================
-- Proyecto Supabase: fdjmepmjjylbabgsljf
-- Se reconstruyen todas las tablas que consumía la aplicación
-- (se borraron al pausarse/inhabilitarse el proyecto).
--
-- Incluye:
--   1. profiles          (con trigger de creación automática al registrarse)
--   2. songs             (catálogo de alabanzas)
--   3. weekly_privileges (privilegios semanales)
--   4. notification_preferences
--   5. notifications
--   6. events
--   7. event_assignments
--   8. Seed del catálogo de alabanzas
--   9. Triggers de notificación por correo (pg_net) — opcionales
--
-- Es idempotente: se puede ejecutar varias veces sin errores.

-- ============================================================
-- 1. Tabla de Perfiles (profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'singer' CHECK (role IN ('singer', 'leader', 'admin')),
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lectura pública de perfiles (nombres/roles para listas y calendarios)
CREATE POLICY "Lectura pública de perfiles" ON public.profiles
  FOR SELECT USING (true);

-- Cada usuario puede actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: crear el perfil automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. Tabla de Catálogo de Alabanzas (songs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  default_key TEXT,
  bpm INTEGER,
  notes TEXT,
  has_tablature BOOLEAN NOT NULL DEFAULT false,
  tablature_content TEXT,
  tablature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en songs
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de alabanzas" ON public.songs
  FOR SELECT USING (true);

CREATE POLICY "Creación de alabanzas para usuarios autenticados" ON public.songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Actualización de alabanzas para usuarios autenticados" ON public.songs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. Tabla de Privilegios Semanales (weekly_privileges)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_privileges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  privilege_key TEXT NOT NULL CHECK (privilege_key IN ('saturday_musician', 'sunday_lead_vocal', 'sunday_choir', 'sunday_rehearsal')),
  assigned_date DATE NOT NULL,
  songs JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(profile_id, privilege_key, assigned_date)
);

-- Habilitar RLS en weekly_privileges
ALTER TABLE public.weekly_privileges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de tabla semanal" ON public.weekly_privileges
  FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden insertar sus propios privilegios" ON public.weekly_privileges
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Los usuarios pueden actualizar sus propios privilegios" ON public.weekly_privileges
  FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Los usuarios pueden eliminar sus propios privilegios" ON public.weekly_privileges
  FOR DELETE USING (auth.uid() = profile_id);

-- ============================================================
-- 4. Tabla de Preferencias de Notificación (notification_preferences)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  assignment_reminder_hours INTEGER NOT NULL DEFAULT 24,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios leen sus propias preferencias" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Los usuarios insertan sus propias preferencias" ON public.notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Los usuarios actualizan sus propias preferencias" ON public.notification_preferences
  FOR UPDATE USING (auth.uid() = profile_id);

-- ============================================================
-- 5. Tabla de Notificaciones (notifications)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios leen sus propias notificaciones" ON public.notifications
  FOR SELECT USING (auth.uid() = profile_id);

CREATE POLICY "Los usuarios actualizan sus propias notificaciones" ON public.notifications
  FOR UPDATE USING (auth.uid() = profile_id);

-- ============================================================
-- 6. Tabla de Eventos (events)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('rehearsal', 'service', 'saturday')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de eventos" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados crean eventos" ON public.events
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados actualizan eventos" ON public.events
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados eliminan eventos" ON public.events
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 7. Tabla de Asignaciones de Eventos (event_assignments)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.event_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead_vocal', 'choir', 'musician', 'sound', 'media')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(event_id, profile_id, role)
);

-- Habilitar RLS en event_assignments
ALTER TABLE public.event_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de asignaciones" ON public.event_assignments
  FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados crean asignaciones" ON public.event_assignments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados actualizan asignaciones" ON public.event_assignments
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios autenticados eliminan asignaciones" ON public.event_assignments
  FOR DELETE USING (auth.role() = 'authenticated');

-- ============================================================
-- 8. Datos iniciales de ejemplo para el catálogo de alabanzas
-- ============================================================
INSERT INTO public.songs (title, default_key) VALUES
  ('Cuan Grande es Él', 'G'),
  ('La Bondad de Dios', 'C'),
  ('En la Tierra como en el Cielos', 'D'),
  ('Glorioso Día', 'D'),
  ('Tu Fidelidad es Grande', 'F'),
  ('Digno de Alabar', 'A')
ON CONFLICT (title) DO NOTHING;

-- ============================================================
-- 9. Notificaciones por correo (TRIGGERS) — OPCIONAL
--    Reemplaza 'https://TU_APP.vercel.app' por NEXT_PUBLIC_APP_URL
--    real de la aplicación antes de activarlo.
-- ============================================================
create extension if not exists pg_net;

create or replace function public.notify_new_song()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', 'new_song',
    'authorId', auth.uid(),
    'songTitle', new.title
  );

  perform net.http_post(
    url := 'https://TU_APP.vercel.app/api/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload::text
  );

  return new;
end;
$$;

create or replace function public.notify_new_privilege()
returns trigger
language plpgsql
security definer
as $$
declare
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', 'new_privilege',
    'authorId', auth.uid(),
    'privilegeKey', new.privilege_key,
    'assignedDate', new.assigned_date::text,
    'songs', coalesce(new.songs, '[]'::jsonb)
  );

  perform net.http_post(
    url := 'https://TU_APP.vercel.app/api/notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload::text
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_song on public.songs;
create trigger trg_notify_new_song
  after insert on public.songs
  for each row execute function public.notify_new_song();

drop trigger if exists trg_notify_new_privilege on public.weekly_privileges;
create trigger trg_notify_new_privilege
  after insert on public.weekly_privileges
  for each row execute function public.notify_new_privilege();
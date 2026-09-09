-- ============================================================
-- ALABANZA IBG: NOTIFICACIONES POR CORREO (TRIGGERS)
-- ============================================================
-- Este script configura disparadores en la base de datos que,
-- al insertar una nueva alabanza (songs) o un nuevo privilegio
-- semanal (weekly_privileges), notifican a la aplicación Next.js
-- vía HTTP para que esta envíe los correos correspondientes.
--
-- Requisitos:
--   1. La extensión pg_net debe estar disponible en el proyecto.
--   2. Reemplaza 'https://TU_APP.vercel.app' por la URL pública real
--      de tu aplicación Next.js (la variable NEXT_PUBLIC_APP_URL).
--   3. Si configuraste NOTIFICATIONS_SECRET en el servidor, cámbialo
--      aquí en el header x-notifications-secret.
-- ============================================================

-- Habilitar pg_net (permite hacer peticiones HTTP desde Postgres)
create extension if not exists pg_net;

-- ============================================================
-- Función: notificar nueva alabanza
-- Se ejecuta tras insertar una fila en la tabla songs.
-- ============================================================
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

-- ============================================================
-- Función: notificar nuevo privilegio
-- Se ejecuta tras insertar/actualizar una fila en weekly_privileges.
-- ============================================================
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

-- ============================================================
-- Triggers
-- ============================================================
drop trigger if exists trg_notify_new_song on public.songs;
create trigger trg_notify_new_song
  after insert on public.songs
  for each row execute function public.notify_new_song();

drop trigger if exists trg_notify_new_privilege on public.weekly_privileges;
create trigger trg_notify_new_privilege
  after insert on public.weekly_privileges
  for each row execute function public.notify_new_privilege();

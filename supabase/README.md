# Supabase: puesta en marcha

Pasos que se hacen a mano en los paneles de Supabase y Vercel. Sin ellos la app no funciona completa.

## 1. Variables de entorno en Vercel

Project → Settings → Environment Variables (Production y Preview):

| Variable | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co`. Cópiala de Supabase → Project Settings → API. **Revisa letra por letra**: un carácter de más o de menos da "No se pudo conectar con el servidor" (antes "Failed to fetch"). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (secreta) |
| `CRON_SECRET` | Cualquier texto largo aleatorio. Vercel lo usa para autorizar el cron de `/api/reminders`. |
| `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY` | Envío de correos |

Las variables `NEXT_PUBLIC_*` se copian al código en el build: **después de cambiarlas hay que hacer Redeploy**.

## 2. Migraciones

No hay CLI de Supabase en este proyecto. Abre Supabase → SQL Editor y ejecuta, **en este orden**, el contenido de (si ya corriste algunas, sigue con la siguiente):

1. `migrations/20260929000000_admin_role_management.sql`: solo un admin puede cambiar roles.
2. `migrations/20260930000000_permissions_and_notifications.sql`:
   - solo líderes y admins gestionan eventos y asignaciones;
   - avisos al asignar a alguien;
   - Realtime en `notifications`;
   - elimina los triggers de correo que apuntaban a `TU_APP.vercel.app`.
3. `migrations/20261001000000_privilege_backing_vocals.sql`: coristas en los privilegios.
4. `migrations/20261002000000_special_events.sql`: tipos y campos de eventos especiales.
5. `migrations/20261003000000_musician_role.sql`: rol de músico e instrumentos.
6. `migrations/20261004000000_remove_leader_role.sql`:
   - quedan tres roles: administrador, cantante y músico; los líderes pasan a cantante;
   - solo el administrador asigna instrumentos.
7. `migrations/20261005000000_events_for_everyone.sql`:
   - cualquier miembro crea eventos; quien lo creó y el admin los editan o eliminan;
   - cada quien se apunta o se sale de un evento; el admin asigna a cualquiera;
   - apuntarse uno mismo no genera el aviso de "Nueva asignación".

Comprobación:

```sql
select tablename, policyname, cmd
from pg_policies
where tablename in ('profiles', 'events', 'event_assignments')
order by tablename, cmd;
```

Deben aparecer "Admins actualizan cualquier perfil", "Miembros crean eventos", "Autor o admin actualizan eventos", "Admin asigna o el miembro se apunta", "Líderes o el miembro actualizan asignaciones" (el nombre quedó de antes; ahora "líder" equivale a admin), etc. Ya **no** deben aparecer "Líderes crean eventos" ni las de "Usuarios autenticados …".

Para dar el primer rol de admin (desde el SQL Editor se permite):

```sql
update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'tu@correo.com');
```

## 3. URLs de autenticación

Supabase → Authentication → URL Configuration:

- **Site URL:** `https://alabanza-ibg.vercel.app`
- **Redirect URLs:**
  - `https://alabanza-ibg.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`

Todos los correos (confirmación de registro, enlace mágico) llegan a `/auth/callback`, que crea la sesión y redirige al panel.

## 4. Realtime

La migración 2 añade `notifications` a la publicación `supabase_realtime`. Si prefieres verlo en el panel: Database → Publications → `supabase_realtime` → la tabla `notifications` debe estar marcada. Sin Realtime el contador de Avisos se actualiza igual al volver a la app, solo que no al instante.

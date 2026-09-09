import { Resend } from 'resend'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { PRIVILEGE_DEFINITIONS, PrivilegeKey } from '@/types/privileges'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = process.env.EMAIL_FROM || 'Alabanza IBG <onboarding@resend.dev>'

export interface EmailRecipient {
  email: string
  full_name?: string | null
}

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function baseLayout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background-color:#1a1a1a;border:1px solid #2e2e2e;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid #2e2e2e;">
                <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">🎵 Alabanza IBG</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid #2e2e2e;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">Ministerio de Alabanza · Iglesia Bautista del Golfo</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function privilegeTitle(key: PrivilegeKey): string {
  const def = PRIVILEGE_DEFINITIONS.find(d => d.key === key)
  return def ? `${def.title} · ${def.dayLabel}` : key
}

/**
 * Envía un correo a un único destinatario. Devuelve true si se envió correctamente.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    return !error
  } catch {
    return false
  }
}

/**
 * Obtiene todos los usuarios con email desde Supabase (auth.admin).
 * Requiere SUPABASE_SERVICE_ROLE_KEY.
 */
export async function getAllUserEmails(): Promise<EmailRecipient[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return []

  try {
    const admin = createAdminClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data, error } = await admin.auth.admin.listUsers()
    if (error || !data?.users) return []

    return data.users
      .filter(u => u.email)
      .map(u => ({
        email: u.email!,
        full_name: u.user_metadata?.full_name || null,
      }))
  } catch {
    return []
  }
}

/**
 * Obtiene el perfil de un usuario (full_name y email) para mensajes de autoría.
 */
export async function getAuthorInfo(userId: string): Promise<{ name: string; email: string | null }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return { name: 'Un miembro', email: null }
  }

  try {
    const admin = createAdminClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data } = await admin.auth.admin.getUserById(userId)
    const name = data?.user?.user_metadata?.full_name || data?.user?.email || 'Un miembro'
    return { name, email: data?.user?.email || null }
  } catch {
    return { name: 'Un miembro', email: null }
  }
}

// ============================================================
// Plantillas de correo
// ============================================================

export async function sendNewSongEmail(
  to: string,
  recipientName: string | null | undefined,
  songTitle: string,
  authorName: string
): Promise<boolean> {
  const greeting = recipientName ? `Hola ${recipientName},` : 'Hola,'
  const html = baseLayout(
    'Nueva alabanza en el repertorio',
    `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(greeting)}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        <strong>${esc(authorName)}</strong> ha agregado una nueva alabanza al repertorio del ministerio.
      </p>
      <div style="background-color:#2e2e2e;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Nueva alabanza</p>
        <p style="margin:4px 0 0;font-size:18px;font-weight:600;">${esc(songTitle)}</p>
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Revisa el catálogo en la app para ver el repertorio actualizado.
      </p>
    `
  )
  return sendEmail(to, `Nueva alabanza: ${songTitle}`, html)
}

export async function sendNewPrivilegeEmail(
  to: string,
  recipientName: string | null | undefined,
  authorName: string,
  privilegeKey: PrivilegeKey,
  assignedDate: string,
  songs: { title: string; key?: string }[]
): Promise<boolean> {
  const greeting = recipientName ? `Hola ${recipientName},` : 'Hola,'
  const songList = songs
    .map(s => `<li style="font-size:14px;line-height:1.6;">${esc(s.title)}${s.key ? ` <span style="color:#9ca3af;">(${esc(s.key)})</span>` : ''}</li>`)
    .join('')

  const html = baseLayout(
    'Nuevo privilegio registrado',
    `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(greeting)}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        <strong>${esc(authorName)}</strong> ha registrado su privilegio para el servicio.
      </p>
      <div style="background-color:#2e2e2e;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
        <p style="margin:0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Privilegio</p>
        <p style="margin:4px 0 12px;font-size:18px;font-weight:600;">${esc(privilegeTitle(privilegeKey))}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#d1d5db;">Fecha: ${esc(assignedDate)}</p>
        ${songs.length ? `
          <p style="margin:12px 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;">Alabanzas</p>
          <ul style="margin:0;padding-left:18px;">${songList}</ul>
        ` : ''}
      </div>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
        Revisa el horario semanal en la app para coordinar.
      </p>
    `
  )
  return sendEmail(to, `Nuevo privilegio registrado · ${privilegeTitle(privilegeKey)}`, html)
}

export async function sendPrivilegeReminderEmail(
  to: string,
  recipientName: string | null | undefined,
  assignedDate: string
): Promise<boolean> {
  const greeting = recipientName ? `Hola ${recipientName},` : 'Hola,'
  const html = baseLayout(
    'Recordatorio: registra tu privilegio',
    `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">${esc(greeting)}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
        Aún no has registrado tu privilegio para el servicio del <strong>${esc(assignedDate)}</strong>.
      </p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
        Para que el equipo pueda coordinar, por favor ingresa a la app y confirma tu participación y el listado de alabanzas.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
        <tr>
          <td style="background-color:#f5f5f5;border-radius:8px;padding:12px 24px;">
            <a href="${esc(process.env.NEXT_PUBLIC_APP_URL || 'https://alabanza-ibg.vercel.app')}/dashboard"
               style="color:#0a0a0a;font-size:14px;font-weight:600;text-decoration:none;">
              Ir al panel →
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;margin-top:12px;">
        ¡Gracias por tu servicio al ministerio!
      </p>
    `
  )
  return sendEmail(to, 'Recordatorio: registra tu privilegio esta semana', html)
}

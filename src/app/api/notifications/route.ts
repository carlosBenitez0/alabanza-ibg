import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminClient } from '@/lib/supabase/admin'
import {
  sendNewSongEmail,
  sendNewPrivilegeEmail,
  getAllUserEmails,
  getAuthorInfo,
  type EmailRecipient,
} from '@/lib/email'
import { PRIVILEGE_DEFINITIONS } from '@/types/privileges'
import { z } from 'zod'

const newSongSchema = z.object({
  type: z.literal('new_song'),
  songTitle: z.string().trim().min(1).max(200),
})

const newPrivilegeSchema = z.object({
  type: z.literal('new_privilege'),
  privilegeKey: z.enum(['saturday_musician', 'sunday_lead_vocal', 'sunday_choir', 'sunday_rehearsal']),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  songs: z.array(z.object({ title: z.string(), key: z.string().optional() })).max(30).default([]),
})

const newEventSchema = z.object({
  type: z.literal('new_event'),
  eventId: z.string().uuid(),
})

const bodySchema = z.discriminatedUnion('type', [newSongSchema, newPrivilegeSchema, newEventSchema])

interface InAppNotification {
  type: string
  title: string
  message: string
  data: Record<string, unknown>
}

/**
 * Announces a new song, weekly privilege or special event to the rest of the team:
 * an in-app notification (if the member keeps "Avisos dentro de la app" on)
 * and an email (if "Notificaciones por email" is on).
 *
 * The author is always the signed-in user; the body cannot choose it.
 * Each announcement goes out once (dedupe_key), so re-saving a privilege
 * or retrying the request never re-notifies everyone.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
  }
  const body = parsed.data

  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json({ error: 'Falta configuración de Supabase' }, { status: 500 })
  }

  // The announced record must exist and belong to the caller
  let dedupeKey: string
  let eventInfo: { title: string; date: string } | null = null
  if (body.type === 'new_event') {
    const { data: row } = await admin
      .from('events')
      .select('id, title, date')
      .eq('id', body.eventId)
      .eq('created_by', user.id)
      .maybeSingle()
    if (!row) return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    dedupeKey = `event:${row.id}`
    eventInfo = { title: row.title, date: row.date }
  } else if (body.type === 'new_privilege') {
    const { data: row } = await admin
      .from('weekly_privileges')
      .select('id')
      .eq('profile_id', user.id)
      .eq('privilege_key', body.privilegeKey)
      .eq('assigned_date', body.assignedDate)
      .maybeSingle()
    if (!row) return NextResponse.json({ error: 'Privilegio no encontrado' }, { status: 404 })
    dedupeKey = `privilege:${row.id}`
  } else {
    const { data: row } = await admin
      .from('songs')
      .select('id')
      .ilike('title', body.songTitle.replace(/[\\%_]/g, (c) => '\\' + c))
      .limit(1)
      .maybeSingle()
    if (!row) return NextResponse.json({ error: 'Alabanza no encontrada' }, { status: 404 })
    dedupeKey = `song:${row.id}`
  }

  const { data: already } = await admin
    .from('notifications')
    .select('id')
    .filter('data->>dedupe_key', 'eq', dedupeKey)
    .limit(1)
  if (already && already.length > 0) {
    return NextResponse.json({ ok: true, skipped: 'ya notificado' })
  }

  const author = await getAuthorInfo(user.id)
  const recipients = (await getAllUserEmails()).filter((r) => r.id !== user.id)

  let notice: InAppNotification
  // In-app only for events: there is no email template for them yet
  let sendMail: ((r: EmailRecipient) => Promise<boolean>) | null = null

  if (body.type === 'new_event') {
    const { title, date } = eventInfo ?? { title: 'un evento', date: '' }
    const [y, m, d] = date.split('-')
    notice = {
      type: 'new_event',
      title: 'Nuevo evento especial',
      message: `${author.name} agregó "${title}"${d ? ` (${d}/${m}/${y})` : ''}. Entra y apúntate si vas a participar.`,
      data: { dedupe_key: dedupeKey, event_id: body.eventId },
    }
  } else if (body.type === 'new_privilege') {
    const def = PRIVILEGE_DEFINITIONS.find((d) => d.key === body.privilegeKey)
    notice = {
      type: 'new_privilege',
      title: 'Nuevo privilegio registrado',
      message: `${author.name} registró "${def?.title ?? body.privilegeKey}" (${def?.dayLabel ?? ''}) con ${body.songs.length} alabanza${body.songs.length === 1 ? '' : 's'}.`,
      data: { dedupe_key: dedupeKey, assigned_date: body.assignedDate },
    }
    sendMail = (r) => sendNewPrivilegeEmail(r.email, r.full_name, author.name, body.privilegeKey, body.assignedDate, body.songs)
  } else {
    notice = {
      type: 'new_song',
      title: 'Nueva alabanza en el repertorio',
      message: `${author.name} agregó "${body.songTitle}" al catálogo.`,
      data: { dedupe_key: dedupeKey },
    }
    sendMail = (r) => sendNewSongEmail(r.email, r.full_name, body.songTitle, author.name)
  }

  // In-app notifications in one insert. The author gets an already-read
  // receipt, which also marks the announcement as sent for the dedupe check.
  const rows = [
    ...recipients.filter((r) => r.push_enabled).map((r) => ({ profile_id: r.id, ...notice, read: false })),
    {
      profile_id: user.id,
      ...notice,
      title: 'Compartido con el equipo',
      message: 'Avisamos al equipo de tu registro.',
      read: true,
    },
  ]
  const { error: insertError } = await admin.from('notifications').insert(rows)
  if (insertError) console.error('Error al crear avisos:', insertError)

  let sent = 0
  for (const r of recipients) {
    if (!sendMail || !r.email_enabled) continue
    if (await sendMail(r)) sent++
  }

  return NextResponse.json({ ok: true, notified: rows.length - 1, sent })
}

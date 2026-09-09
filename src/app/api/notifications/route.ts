import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  sendNewSongEmail,
  sendNewPrivilegeEmail,
  getAllUserEmails,
  getAuthorInfo,
} from '@/lib/email'
import { z } from 'zod'

const newSongSchema = z.object({
  type: z.literal('new_song'),
  songTitle: z.string().min(1),
  authorId: z.string().min(1),
})

const newPrivilegeSchema = z.object({
  type: z.literal('new_privilege'),
  authorId: z.string().min(1),
  privilegeKey: z.enum([
    'saturday_musician',
    'sunday_lead_vocal',
    'sunday_choir',
    'sunday_rehearsal',
  ]),
  assignedDate: z.string().min(1),
  songs: z.array(z.object({ title: z.string(), key: z.string().optional() })).default([]),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado. Se requiere iniciar sesión.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const recipients = await getAllUserEmails()
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No hay destinatarios o falta configuración' }, { status: 500 })
  }

  if (body && typeof body === 'object' && 'type' in body && body.type === 'new_song') {
    const parsed = newSongSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { songTitle, authorId } = parsed.data
    const author = await getAuthorInfo(authorId)

    let sent = 0
    for (const r of recipients) {
      if (r.email && r.email.toLowerCase() === author.email?.toLowerCase()) continue
      const ok = await sendNewSongEmail(r.email, r.full_name, songTitle, author.name)
      if (ok) sent++
    }
    return NextResponse.json({ ok: true, sent })
  }

  if (body && typeof body === 'object' && 'type' in body && body.type === 'new_privilege') {
    const parsed = newPrivilegeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })
    }
    const { authorId, privilegeKey, assignedDate, songs } = parsed.data
    const author = await getAuthorInfo(authorId)

    let sent = 0
    for (const r of recipients) {
      if (r.email && r.email.toLowerCase() === author.email?.toLowerCase()) continue
      const ok = await sendNewPrivilegeEmail(r.email, r.full_name, author.name, privilegeKey, assignedDate, songs)
      if (ok) sent++
    }
    return NextResponse.json({ ok: true, sent })
  }

  return NextResponse.json({ error: 'Tipo de notificación no soportado' }, { status: 400 })
}

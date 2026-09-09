import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPrivilegeReminderEmail } from '@/lib/email'
import { formatFullSpanishDate, formatISOShortDate } from '@/lib/date-helpers'

export const dynamic = 'force-dynamic'

const REQUEST_SECRET = process.env.NOTIFICATIONS_SECRET

/**
 * Ruta de recordatorios programada para ejecutarse (normalmente) lunes y miércoles vía cron.
 * Consulta qué usuarios aún no han registrado ningún privilegio para la semana vigente
 * y les envía un correo de recordatorio.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const isAuthorized =
    isVercelCron ||
    (REQUEST_SECRET && authHeader === `Bearer ${REQUEST_SECRET}`)

  if (!isAuthorized) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Falta configuración de Supabase/Resend' },
      { status: 500 }
    )
  }

  const admin = createAdminClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Semana vigente: lunes a domingo actual
  const now = new Date()
  const day = now.getDay() // 0 = domingo
  const mondayOffset = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  // Sábado y domingo de la semana, y de la siguiente
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  const nextSaturday = new Date(nextMonday)
  nextSaturday.setDate(nextMonday.getDate() + 5)
  const nextSunday = new Date(nextMonday)
  nextSunday.setDate(nextMonday.getDate() + 6)

  const upcomingDates = [
    formatISOShortDate(saturday),
    formatISOShortDate(sunday),
    formatISOShortDate(nextSaturday),
    formatISOShortDate(nextSunday),
  ]

  // Fecha del servicio más próximo (sábado o domingo) para mostrar en el correo
  const serviceDate = formatISOShortDate(
    now.getDay() === 6 ? saturday : sunday
  )

  // Obtener todos los usuarios
  const { data: usersData, error: usersError } = await admin.auth.admin.listUsers()
  if (usersError) {
    return NextResponse.json({ error: 'Error al listar usuarios' }, { status: 500 })
  }

  // Obtener los profile_ids que ya registraron privilegios en alguna fecha objetivo
  const { data: registrations } = await admin
    .from('weekly_privileges')
    .select('profile_id')
    .in('assigned_date', upcomingDates)

  const registeredIds = new Set((registrations || []).map(r => r.profile_id))
  const dateLabel = formatFullSpanishDate(serviceDate)

  let sent = 0
  let skipped = 0
  for (const u of usersData?.users || []) {
    if (!u.email || registeredIds.has(u.id)) {
      skipped++
      continue
    }
    const name = u.user_metadata?.full_name || null
    const ok = await sendPrivilegeReminderEmail(u.email, name, dateLabel)
    if (ok) sent++
  }

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    serviceDate,
    targetDates: upcomingDates,
  })
}

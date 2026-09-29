import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Teach tailwind-merge the custom `text-caption` size (globals.css @theme),
// otherwise it is mistaken for a text color and dropped next to one
const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: ['caption'] }] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, { hour: '2-digit', minute: '2-digit' })
}

export function formatTime(time?: string): string {
  if (!time) return ''
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    rehearsal: 'Ensayo',
    service: 'Culto',
    saturday: 'Sábado',
  }
  return labels[type] || type
}

// Event types are structural, not status: grayscale only (DESIGN.md reserves color for states)
export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    rehearsal: 'bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-normal)]',
    service: 'bg-[var(--text-primary)] text-[var(--text-inverse)] border border-[var(--text-primary)]',
    saturday: 'bg-[var(--color-gs-3)] text-[var(--color-gs-11)] border border-[var(--color-gs-5)]',
  }
  return colors[type] || 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
}

export function getAssignmentRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    lead_vocal: 'Voz Principal',
    choir: 'Coro',
    musician: 'Músico',
    sound: 'Sonido',
    media: 'Multimedia',
  }
  return labels[role] || role
}

export function getAssignmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    declined: 'Rechazado',
  }
  return labels[status] || status
}

export function getAssignmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-[var(--color-warning-dark)]/30 text-[var(--color-warning)] border border-[var(--color-warning)]/40',
    confirmed: 'bg-[var(--color-success-dark)]/30 text-[var(--color-success)] border border-[var(--color-success)]/40',
    declined: 'bg-[var(--color-error-dark)]/30 text-[var(--color-error)] border border-[var(--color-error)]/40',
  }
  return colors[status] || 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
}

export function getSongListStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    submitted: 'Enviado',
    approved: 'Aprobado',
  }
  return labels[status] || status
}

export function generateWhatsAppMessage(
  eventTitle: string,
  eventDate: string,
  role: string,
  singerName: string,
  songs: { title: string; key?: string; bpm?: number }[]
): string {
  const songLines = songs.map((s, i) => {
    const parts = [`${i + 1}. ${s.title}`]
    if (s.key) parts.push(`(${s.key})`)
    if (s.bpm) parts.push(`- ${s.bpm} BPM`)
    return parts.join(' ')
  }).join('\n')

  return `🎵 *Lista de Alabanzas - ${eventTitle}*\n👤 *${getAssignmentRoleLabel(role)}:* ${singerName}\n📅 *Fecha:* ${formatDate(eventDate)}\n\n${songLines}\n\n_Enviado desde Alabanza IBG_`
}

export function generateWhatsAppUrl(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
/**
 * Only allows same-site relative paths ("/dashboard/songs"). Anything else
 * (absolute URLs, protocol-relative "//evil.com", backslash tricks) falls
 * back to the dashboard, so redirect params can't send users off-site.
 */
export function safeRedirect(path: string | null | undefined, fallback = '/dashboard'): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

/** Human message for Supabase auth errors, including network failures */
export function getAuthErrorMessage(message: string): string {
  if (message === 'Supabase not configured') {
    return 'Supabase no está configurado. Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  }
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo. Si el problema sigue, avisa al administrador.'
  }
  if (message.includes('Invalid login credentials')) return 'Credenciales incorrectas (email o contraseña no válidos)'
  if (message.includes('Email not confirmed')) return 'Tu correo aún no está confirmado. Revisa tu bandeja de entrada.'
  if (message.includes('User already registered')) return 'Este email ya está registrado'
  if (/rate limit|too many/i.test(message)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  return message
}

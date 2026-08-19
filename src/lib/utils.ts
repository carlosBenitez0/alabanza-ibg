import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    rehearsal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    service: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    saturday: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  }
  return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
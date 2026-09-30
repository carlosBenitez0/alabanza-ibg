'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { Button, PageHeader, PageLoader, EmptyState } from '@/components/ui'
import { Bell, Calendar, Check, CheckCheck, Clock, Music, ChevronRight, Mic2 } from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

function NotificationIcon({ type }: { type: string }) {
  const className = 'w-5 h-5'
  switch (type) {
    case 'assignment': return <Calendar className={cn(className, 'text-[var(--color-info)]')} aria-hidden="true" />
    case 'song_list_submitted':
    case 'new_song': return <Music className={cn(className, 'text-[var(--color-success)]')} aria-hidden="true" />
    case 'song_list_approved': return <Check className={cn(className, 'text-[var(--color-success)]')} aria-hidden="true" />
    case 'reminder': return <Clock className={cn(className, 'text-[var(--color-warning)]')} aria-hidden="true" />
    case 'backing_vocal': return <Mic2 className={cn(className, 'text-[var(--color-info)]')} aria-hidden="true" />
    default: return <Bell className={cn(className, 'text-[var(--text-secondary)]')} aria-hidden="true" />
  }
}

/** Where a notification leads, if anywhere */
function getNotificationHref(notification: Notification): { href: string; label: string } | null {
  const eventId = notification.data?.event_id
  if (typeof eventId === 'string' && eventId) {
    return { href: `/dashboard/events/${eventId}`, label: 'Ver evento' }
  }
  if (notification.type === 'new_privilege' || notification.type === 'backing_vocal') {
    return { href: '/dashboard/weekly-schedule', label: 'Ver tabla semanal' }
  }
  if (notification.type === 'new_song') {
    return { href: '/dashboard/songs', label: 'Ver repertorio' }
  }
  return null
}

function getTimeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours} h`
  if (diffDays < 7) return `Hace ${diffDays} d`
  return formatDate(dateString)
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { refreshUnread } = useProfile()
  const supabase = useSupabase()
  const fetchNotifications = useCallback(async (): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    return data || []
  }, [supabase, user])

  const { data: notifications, setData: setNotifications, loading } = useAsyncData<Notification[]>(
    user ? fetchNotifications : null,
    []
  )

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    refreshUnread()
  }

  const markAllAsRead = async () => {
    if (!user) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('profile_id', user.id).eq('read', false)
    refreshUnread()
  }

  if (authLoading || loading) {
    return <PageLoader />
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader
        title="Notificaciones"
        description="Mantente al día con tu ministerio"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4" />
              Marcar todo como leído ({unreadCount})
            </Button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell />}
          title="No hay notificaciones"
          description="Cuando tengas actividad, aparecerá aquí."
        />
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {notifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} onRead={markAsRead} />
          ))}
        </ul>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification
  onRead: (id: string) => void
}) {
  const isUnread = !notification.read
  const target = getNotificationHref(notification)

  const body = (
    <>
      <span className="shrink-0 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center">
        <NotificationIcon type={notification.type} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('text-sm text-[var(--text-primary)]', isUnread ? 'font-semibold' : 'font-medium')}>
            {notification.title}
          </span>
          {isUnread && <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--text-primary)] shrink-0" aria-label="Sin leer" />}
        </span>
        <span className="block text-sm text-[var(--text-secondary)] mt-0.5 break-words">{notification.message}</span>
        <span className="flex items-center gap-2 mt-1.5 text-xs text-[var(--text-tertiary)]">
          <time dateTime={notification.created_at}>{getTimeAgo(notification.created_at)}</time>
          {target && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-[var(--text-secondary)]">{target.label}</span>
            </>
          )}
        </span>
      </span>
      {target && <ChevronRight className="w-4 h-4 mt-3 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />}
    </>
  )

  const rowClasses = cn(
    'flex items-start gap-3 w-full text-left p-3 sm:p-4 transition-colors',
    target && 'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]'
  )

  return (
    <li
      className={cn(
        'rounded-[var(--radius-lg)] border overflow-hidden flex items-stretch',
        isUnread ? 'bg-[var(--bg-raised)] border-[var(--border-strong)]' : 'bg-[var(--bg-page)] border-[var(--border-subtle)]'
      )}
    >
      {target ? (
        <Link href={target.href} onClick={() => isUnread && onRead(notification.id)} className={cn(rowClasses, 'flex-1 min-w-0')}>
          {body}
        </Link>
      ) : (
        <div className={cn(rowClasses, 'flex-1 min-w-0')}>{body}</div>
      )}
      {isUnread && (
        <button
          type="button"
          onClick={() => onRead(notification.id)}
          className="shrink-0 w-12 sm:w-14 flex items-center justify-center border-l border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
          aria-label={`Marcar como leída: ${notification.title}`}
          title="Marcar como leída"
        >
          <Check className="w-5 h-5" />
        </button>
      )}
    </li>
  )
}

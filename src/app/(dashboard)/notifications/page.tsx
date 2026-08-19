'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { Bell, Mail, Calendar, Check, Clock, Music, AlertCircle } from 'lucide-react'
import { formatDate, formatTime, cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, unknown> | null
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ read: true }).eq('profile_id', user?.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment': return <Calendar className="w-5 h-5 text-blue-600" />
      case 'song_list_submitted': return <Music className="w-5 h-5 text-green-600" />
      case 'song_list_approved': return <Check className="w-5 h-5 text-green-600" />
      case 'reminder': return <Clock className="w-5 h-5 text-amber-600" />
      default: return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const getNotificationAction = (notification: Notification) => {
    if (notification.data?.event_id) {
      return (
        <Link href={`/dashboard/events/${notification.data.event_id}`} className="text-sm text-primary hover:underline">
          Ver evento
        </Link>
      )
    }
    if (notification.data?.song_list_id) {
      return (
        <Link href={`/dashboard/events/${notification.data.event_id}/song-list`} className="text-sm text-primary hover:underline">
          Ver lista
        </Link>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            Notificaciones
          </h1>
          <p className="text-muted-foreground mt-1">Mantente al día con tu ministerio</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <Check className="w-4 h-4 mr-2" />
            Marcar todo como leído ({unreadCount})
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No hay notificaciones</h3>
            <p className="text-muted-foreground">Cuando tengas actividad, aparecerá aquí.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onRead={markAsRead}
              icon={getNotificationIcon(notification.type)}
              action={getNotificationAction(notification)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  onRead,
  icon,
  action,
}: {
  notification: Notification
  onRead: (id: string) => void
  icon: React.ReactNode
  action: React.ReactNode | null
}) {
  const isUnread = !notification.read
  const timeAgo = getTimeAgo(notification.created_at)

  return (
    <Card
      className={cn(
        'transition-colors',
        isUnread ? 'bg-primary/5 border-primary/20' : 'hover:shadow-md'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn('font-medium text-foreground', isUnread && 'font-semibold')}>
                  {notification.title}
                </h4>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                {isUnread && (
                  <span className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            </div>
            {action && (
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                {action}
                {isUnread && (
                  <Button variant="ghost" size="sm" onClick={() => onRead(notification.id)}>
                    Marcar como leído
                  </Button>
                )}
              </div>
            )}
            {!action && isUnread && (
              <div className="mt-3">
                <Button variant="ghost" size="sm" onClick={() => onRead(notification.id)}>
                  Marcar como leído
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Ahora mismo'
  if (diffMins < 60) return `Hace ${diffMins} min`
  if (diffHours < 24) return `Hace ${diffHours}h`
  if (diffDays < 7) return `Hace ${diffDays}d`
  return formatDate(date)
}
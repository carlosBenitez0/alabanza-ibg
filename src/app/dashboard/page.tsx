'use client'

import { useState, useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { WeeklyPrivilege, PRIVILEGE_DEFINITIONS, PrivilegeKey } from '@/types/privileges'
import { getWeekBounds, formatFullSpanishDate, formatISOShortDate } from '@/lib/date-helpers'
import { fetchPrivileges, orderUserPrivileges } from '@/lib/privilege-storage'
import { songViewerHref } from '@/lib/song-links'
import { RegisterPrivilegeModal } from '@/components/privileges/register-privilege-modal'
import { Card, CardContent, CardHeader, Button, Badge, PageHeader, PageLoader, EmptyState, Fab, buttonVariants } from '@/components/ui'
import { Calendar, Music, Plus, Music2, ListMusic, UserCheck, ArrowRight, Pencil } from 'lucide-react'
import { useGsapMountReveal, useGsapReveal } from '@/hooks/use-gsap-reveal'
import { cn } from '@/lib/utils'

const quickLinks = [
  { href: '/dashboard/weekly-schedule', label: 'Tabla Semanal Completa', icon: ListMusic },
  { href: '/dashboard/songs', label: 'Repertorio de Alabanzas', icon: Music2 },
  { href: '/dashboard/events', label: 'Mis Eventos Históricos', icon: Calendar },
]

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const supabase = useSupabase()

  const [selectedPrivilegeKey, setSelectedPrivilegeKey] = useState<PrivilegeKey>('saturday_musician')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const headerRef = useGsapMountReveal<HTMLDivElement>({ from: 'bottom', duration: 0.5 })
  const contentRef = useGsapReveal<HTMLDivElement>({ selector: '.dashboard-card', stagger: 0.08 })

  const fetchDashboardData = useCallback(async () => {
    const { start, end } = getWeekBounds(new Date())
    const week = await fetchPrivileges(supabase, { from: formatISOShortDate(start), to: formatISOShortDate(end) })
    const mine = orderUserPrivileges(
      week.filter((p) => p.profile_id === user?.id),
      formatISOShortDate(new Date())
    )
    return { week, mine }
  }, [supabase, user])

  const { data, loading, reload } = useAsyncData(user ? fetchDashboardData : null, {
    week: [] as WeeklyPrivilege[],
    mine: [] as WeeklyPrivilege[],
  })
  const weeklyMatrix = data.week
  const myWeeklyPrivileges = data.mine

  if (authLoading || loading) {
    return <PageLoader />
  }

  const handleOpenModal = (key?: PrivilegeKey) => {
    setSelectedPrivilegeKey(key ?? myWeeklyPrivileges[0]?.privilege_key ?? 'saturday_musician')
    setIsModalOpen(true)
  }

  const firstName = user?.user_metadata?.full_name || user?.email?.split('@')[0]

  return (
    <div className="space-y-6 sm:space-y-8 text-[var(--text-primary)]">
      <RegisterPrivilegeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultPrivilegeKey={selectedPrivilegeKey}
        onSuccess={reload}
      />

      <PageHeader
        ref={headerRef}
        title="Mi Panel"
        description={
          <>
            Bienvenido, <span className="text-[var(--text-primary)] font-semibold">{firstName}</span>
            <span className="hidden sm:inline"> — Ministerio de Alabanza IBG</span>
          </>
        }
        actionsDesktopOnly
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4" />
            Registrar / Editar Mi Privilegio
          </Button>
        }
      />

      <Fab icon={<Plus />} label="Mi privilegio" onClick={() => handleOpenModal()} />

      <div ref={contentRef} className="grid gap-6 sm:gap-8 lg:grid-cols-3">
        {/* My privileges this week */}
        <section className="lg:col-span-2 dashboard-card min-w-0" aria-labelledby="my-privileges-title">
          <h2 id="my-privileges-title" className="text-base font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
            Mis Privilegios de la Semana
          </h2>

          {myWeeklyPrivileges.length > 0 ? (
            <div className="space-y-4">
              {myWeeklyPrivileges.map((privilege, idx) => (
                <MyPrivilegeCard
                  key={privilege.id}
                  privilege={privilege}
                  isMain={idx === 0}
                  onEdit={() => handleOpenModal(privilege.privilege_key)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Calendar />}
              title="Aún no has registrado tu privilegio para esta semana"
              description="Selecciona tu función para Sábado o Domingo y agrega las alabanzas que cantarás o tocarás con el ministerio."
              action={
                <Button onClick={() => handleOpenModal()} fullWidthMobile>
                  <Plus className="w-4 h-4" />
                  Registrar Mi Privilegio Ahora
                </Button>
              }
            />
          )}
        </section>

        {/* Sidebar: quick links (desktop only, phones have the bottom nav) + week summary */}
        <aside className="space-y-6 min-w-0">
          <div className="dashboard-card space-y-3 hidden lg:block">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono">Accesos Rápidos</h3>
            <div className="grid gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={buttonVariants({ variant: 'outline', className: 'w-full justify-between h-auto p-3 text-xs' })}
                >
                  <span className="flex items-center gap-2 font-medium">
                    <link.icon className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
                    {link.label}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          <section className="dashboard-card space-y-3" aria-labelledby="week-summary-title">
            <div className="flex items-center justify-between gap-2">
              <h3 id="week-summary-title" className="text-sm font-bold uppercase tracking-wider font-mono">
                Esta Semana
              </h3>
              <Badge variant="outline" size="sm">{weeklyMatrix.length} Asignados</Badge>
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--bg-raised)] border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
              {weeklyMatrix.length === 0 ? (
                <p className="text-sm text-[var(--text-tertiary)] text-center py-6 px-4">
                  Nadie ha registrado privilegios aún para esta semana.
                </p>
              ) : (
                weeklyMatrix.slice(0, 5).map((item) => {
                  const def = PRIVILEGE_DEFINITIONS.find((p) => p.key === item.privilege_key)
                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold truncate">{item.profile_name}</span>
                        <span className="block text-xs text-[var(--text-tertiary)] truncate">{def?.title}</span>
                      </div>
                      <Badge variant={def?.day === 'saturday' ? 'brand' : 'secondary'} size="sm">
                        {def?.dayLabel}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
            <Link
              href="/dashboard/weekly-schedule"
              className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'w-full justify-between' })}
            >
              Ver tabla completa
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MyPrivilegeCard({
  privilege,
  isMain,
  onEdit,
}: {
  privilege: WeeklyPrivilege
  isMain: boolean
  onEdit: () => void
}) {
  const def = PRIVILEGE_DEFINITIONS.find((p) => p.key === privilege.privilege_key)

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        isMain
          ? 'border-[var(--border-normal)] bg-[var(--bg-raised)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-raised)]/40'
      )}
    >
      <CardHeader className={cn('border-b border-[var(--border-subtle)]', isMain ? 'bg-[var(--bg-page)]' : 'bg-[var(--bg-page)]/20')}>
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center shrink-0',
              isMain
                ? 'bg-[var(--text-primary)] text-[var(--text-inverse)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
            )}
          >
            <Music className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-bold">{def?.title || 'Mi Privilegio'}</h3>
              <Badge variant={isMain ? 'brand' : 'secondary'} size="sm">
                {def?.dayLabel || 'Servicio'}
              </Badge>
              {!isMain && (
                <Badge variant="outline" size="sm" className="text-[var(--text-tertiary)]">
                  Siguiente
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{def?.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 sm:pt-4 space-y-4">
        <p className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
          {formatFullSpanishDate(privilege.assigned_date)}
        </p>

        <div className="space-y-2">
          <p className="text-xs font-semibold flex items-center gap-2">
            <Music2 className="w-4 h-4 text-[var(--text-secondary)]" aria-hidden="true" />
            Repertorio a Ensayar ({privilege.songs?.length || 0})
          </p>

          {privilege.songs && privilege.songs.length > 0 ? (
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {privilege.songs.map((song, sIdx) => (
                <li key={sIdx}>
                  <Link
                    href={songViewerHref(song)}
                    className="min-h-11 px-3 py-2 rounded-[var(--radius-md)] flex items-center justify-between gap-2 text-sm border bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--text-tertiary)] active:bg-[var(--bg-hover)] transition-colors"
                    aria-label={`Ver tablatura de ${song.title}${song.key ? ` en ${song.key}` : ''}`}
                  >
                    <span className="font-medium min-w-0 truncate">
                      {sIdx + 1}. {song.title}
                    </span>
                    {song.key && (
                      <span className="text-caption font-mono px-2 py-0.5 rounded bg-[var(--bg-active)] text-[var(--text-secondary)] border border-[var(--border-subtle)] shrink-0">
                        Tono: {song.key}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="p-4 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)]">
              No has registrado canciones aún para tu privilegio.
            </p>
          )}
        </div>

        {privilege.notes && (
          <p className="p-3 rounded-[var(--radius-md)] text-sm italic text-[var(--text-tertiary)] border bg-[var(--bg-surface)] border-[var(--border-subtle)] break-words">
            &ldquo;{privilege.notes}&rdquo;
          </p>
        )}

        <div className="pt-3 border-t border-[var(--border-subtle)] flex sm:justify-end">
          <Button size="sm" variant="outline" onClick={onEdit} fullWidthMobile>
            <Pencil className="w-4 h-4" />
            Editar Mi Privilegio y Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

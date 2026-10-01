'use client'

import { useCallback, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { Search, Users, ChevronRight, Phone, Check } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { Badge, Button, Input, Modal, PageHeader, PageLoader, EmptyState, ErrorState } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Instrument, UserRole } from '@/types'
import { INSTRUMENT_OPTIONS, ROLE_OPTIONS, getRoleWithInstruments } from '@/lib/roles'

interface MemberRow {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
  instruments?: string[] | null
}

export default function AdminUsersPage() {
  const supabase = useSupabase()
  const { user } = useAuth()
  const { isAdmin } = useProfile()
  const { toast } = useToast()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<MemberRow | null>(null)
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null)
  const [pendingInstruments, setPendingInstruments] = useState<Instrument[]>([])
  const [saving, setSaving] = useState(false)

  // Only admins change roles and instruments (enforced again in the database)
  const canEditRoles = isAdmin

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('id, full_name, role, phone, instruments').order('full_name')
    if (error) throw error
    return (data as MemberRow[]) || []
  }, [supabase])
  const { data: members, loading, error, reload } = useAsyncData<MemberRow[]>(load, [])

  const openMember = (m: MemberRow) => {
    setSelected(m)
    setPendingRole(m.role)
    setPendingInstruments((m.instruments || []) as Instrument[])
  }

  const toggleInstrument = (value: Instrument) =>
    setPendingInstruments((prev) => (prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value]))

  // Only musicians keep instruments
  const nextInstruments = pendingRole === 'musician' ? pendingInstruments : []
  const sameInstruments = (a: string[], b: string[]) => a.length === b.length && a.every((i) => b.includes(i))
  const hasChanges =
    !!selected && !!pendingRole && (pendingRole !== selected.role || !sameInstruments(nextInstruments, selected.instruments || []))

  const saveRole = async () => {
    if (!selected || !pendingRole) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ role: pendingRole, instruments: nextInstruments })
      .eq('id', selected.id)
    setSaving(false)
    if (error) {
      toast({ title: 'No se pudo guardar', description: 'Verifica que tienes permisos de administrador.', variant: 'destructive' })
      return
    }
    toast({
      title: 'Rol actualizado',
      description: `${selected.full_name || 'El miembro'} ahora es ${getRoleWithInstruments(pendingRole, nextInstruments)}.`,
      variant: 'success',
    })
    setSelected(null)
    setPendingRole(null)
    reload()
  }

  if (loading) return <PageLoader />
  if (error && members.length === 0) return <ErrorState title="No se pudieron cargar los miembros" onRetry={reload} />

  const q = query.trim().toLowerCase()
  const filtered = members.filter(
    (m) =>
      (m.full_name || '').toLowerCase().includes(q) ||
      getRoleWithInstruments(m.role, m.instruments).toLowerCase().includes(q)
  )

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Usuarios"
        description={canEditRoles ? 'Miembros del ministerio. Toca uno para cambiar su rol o sus instrumentos.' : 'Miembros del ministerio.'}
      />

      <div className="unstick-landscape sticky top-[calc(var(--header-h)+var(--safe-top))] lg:top-16 z-[150] -mx-4 sm:-mx-6 lg:mx-0 px-4 sm:px-6 lg:px-0 py-2 bg-[var(--bg-page)]/90 backdrop-blur-md">
        <div className="lg:max-w-md">
          <Input
            type="search"
            enterKeyHint="search"
            aria-label="Buscar miembro"
            placeholder="Buscar por nombre o rol…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leadingIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users />} title="Sin resultados" description="Prueba con otro nombre." />
      ) : (
        <ul className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-raised)] divide-y divide-[var(--border-subtle)] overflow-hidden lg:grid lg:grid-cols-2 lg:divide-y-0 lg:gap-px lg:bg-[var(--border-subtle)]">
          {filtered.map((m) => {
            const isMe = m.id === user?.id
            const Row = canEditRoles && !isMe ? 'button' : 'div'
            return (
              <li key={m.id} className="bg-[var(--bg-raised)]">
                <Row
                  {...(Row === 'button'
                    ? { type: 'button' as const, onClick: () => openMember(m) }
                    : {})}
                  className={cn(
                    'w-full flex items-center gap-3 min-h-14 px-3 sm:px-4 py-2.5 text-left',
                    Row === 'button' && 'hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors'
                  )}
                >
                  <span className="w-9 h-9 rounded-full bg-[var(--bg-active)] border border-[var(--border-normal)] flex items-center justify-center text-sm font-semibold shrink-0">
                    {(m.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold truncate">
                      {m.full_name || 'Sin nombre'}
                      {isMe && <span className="font-normal text-[var(--text-tertiary)]"> (tú)</span>}
                    </span>
                    {m.phone && (
                      <span className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] font-mono">
                        <Phone className="w-3 h-3" aria-hidden="true" />
                        {m.phone}
                      </span>
                    )}
                  </span>
                  <Badge size="sm" variant={m.role === 'singer' ? 'outline' : 'secondary'}>
                    {getRoleWithInstruments(m.role, m.instruments)}
                  </Badge>
                  {Row === 'button' && <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />}
                </Row>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        size="sm"
        title={selected?.full_name || 'Miembro'}
        description="Rol e instrumentos en el ministerio"
        dismissible={!saving}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={saveRole} loading={saving} disabled={!hasChanges}>
              Guardar
            </Button>
          </>
        }
      >
        <fieldset className="grid gap-2">
          <legend className="sr-only">Rol</legend>
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={pendingRole === opt.value}
              onClick={() => setPendingRole(opt.value)}
              className={cn(
                'min-h-14 px-4 py-2.5 rounded-[var(--radius-md)] border text-left transition-colors',
                pendingRole === opt.value
                  ? 'border-[var(--text-primary)] bg-[var(--bg-hover)]'
                  : 'border-[var(--border-normal)] bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]'
              )}
            >
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="block text-xs text-[var(--text-tertiary)]">{opt.description}</span>
            </button>
          ))}
        </fieldset>

        {pendingRole === 'musician' && (
          <fieldset className="mt-5 space-y-2">
            <legend className="text-sm font-medium text-[var(--text-primary)]">Instrumentos</legend>
            <p className="text-xs text-[var(--text-tertiary)]">Es lo que se muestra como su rol. Puedes elegir más de uno.</p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {INSTRUMENT_OPTIONS.map((opt) => {
                const active = pendingInstruments.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleInstrument(opt.value)}
                    disabled={saving}
                    className={cn(
                      'min-h-11 px-3 rounded-[var(--radius-md)] border text-sm font-medium flex items-center justify-between gap-2 transition-colors',
                      active
                        ? 'bg-[var(--text-primary)] text-[var(--text-inverse)] border-[var(--text-primary)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-normal)] hover:text-[var(--text-primary)]'
                    )}
                  >
                    {opt.label}
                    {active && <Check className="w-4 h-4" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </Modal>
    </div>
  )
}

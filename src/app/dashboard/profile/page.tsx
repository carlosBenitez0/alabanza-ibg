'use client'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useCallback, useEffect, useState } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Badge, Switch, Modal, PageHeader, PageLoader } from '@/components/ui'
import { User, Mail, Phone, Bell, Save, AlertCircle, Trash2, Check } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { useProfile } from '@/components/providers/profile-provider'
import { INSTRUMENT_OPTIONS, getRoleLabel } from '@/lib/roles'
import { cn } from '@/lib/utils'
import type { Instrument } from '@/types'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  instruments: z.array(z.enum(['guitar', 'drums', 'trumpet', 'piano', 'bass'])),
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  assignment_reminder_hours: z.number().min(1).max(168),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const { refreshProfile } = useProfile()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { register, handleSubmit, reset, setValue, control, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      instruments: [],
      email_enabled: true,
      push_enabled: true,
      assignment_reminder_hours: 24,
    },
    mode: 'onChange',
  })

  const loadProfile = useCallback(async () => {
    const loadProfileRow = async () => {
      const full = await supabase.from('profiles').select('full_name, phone, role, instruments').eq('id', user?.id).single()
      if (!full.error) return full
      // Database without the musician migration yet
      return supabase.from('profiles').select('full_name, phone, role').eq('id', user?.id).single()
    }
    const [{ data: profileData }, { data: prefsData }] = await Promise.all([
      loadProfileRow() as Promise<{ data: { full_name: string | null; phone: string | null; role: string; instruments?: Instrument[] | null } | null }>,
      supabase
        .from('notification_preferences')
        .select('email_enabled, push_enabled, assignment_reminder_hours')
        .eq('profile_id', user?.id)
        .maybeSingle(),
    ])
    if (!profileData) return null
    return {
      full_name: profileData.full_name || '',
      phone: profileData.phone || '',
      role: profileData.role as string,
      instruments: (profileData.instruments || []) as Instrument[],
      email_enabled: prefsData?.email_enabled ?? true,
      push_enabled: prefsData?.push_enabled ?? true,
      assignment_reminder_hours: prefsData?.assignment_reminder_hours ?? 24,
    }
  }, [supabase, user?.id])

  const { data: profile, loading } = useAsyncData(user ? loadProfile : null, null)
  const isMusician = profile?.role === 'musician'
  const instruments = useWatch({ control, name: 'instruments' }) || []

  // Loaded values become the form's pristine state, so isDirty tracks real edits
  useEffect(() => {
    if (!profile) return
    reset({
      full_name: profile.full_name,
      phone: profile.phone,
      instruments: profile.instruments,
      email_enabled: profile.email_enabled,
      push_enabled: profile.push_enabled,
      assignment_reminder_hours: profile.assignment_reminder_hours,
    })
  }, [profile, reset])

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          // Only musicians have instruments (and older databases lack the column)
          ...(isMusician ? { instruments: data.instruments } : {}),
        })
        .eq('id', user?.id)

      if (profileError) throw profileError

      const { error: prefsError } = await supabase
        .from('notification_preferences')
        .upsert({
          profile_id: user?.id,
          email_enabled: data.email_enabled,
          push_enabled: data.push_enabled,
          assignment_reminder_hours: data.assignment_reminder_hours,
        })

      if (prefsError) throw prefsError

      await refreshSession()
      refreshProfile()
      reset(data)
      toast({ title: 'Guardado', description: 'Perfil actualizado correctamente', variant: 'success' })
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar el perfil', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/delete-account', { method: 'POST' })
      if (!res.ok) throw new Error('Error al eliminar cuenta')
      
      await supabase.auth.signOut()
      router.replace('/login')
      router.refresh()
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la cuenta', variant: 'destructive' })
      setSaving(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const toggleInstrument = (value: Instrument) => {
    const next = instruments.includes(value) ? instruments.filter((i) => i !== value) : [...instruments, value]
    setValue('instruments', next, { shouldDirty: true })
  }

  return (
    <div className="max-w-2xl space-y-5 sm:space-y-6 animate-fade-in">
      <PageHeader title="Mi Perfil" description="Gestiona tu información personal y preferencias" />

      <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6" noValidate>
        {/* Personal info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              id="full_name"
              label="Nombre completo"
              placeholder="Juan Pérez"
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              error={errors.full_name?.message}
              leadingIcon={<User className="w-4 h-4" />}
              {...register('full_name')}
              disabled={saving}
            />

            <Input
              id="email"
              label="Email"
              type="email"
              value={user?.email || ''}
              disabled
              readOnly
              leadingIcon={<Mail className="w-4 h-4" />}
              hint="El email no se puede cambiar desde aquí."
            />

            <Input
              id="phone"
              label="Teléfono"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="done"
              placeholder="+503 7123-4567"
              error={errors.phone?.message}
              leadingIcon={<Phone className="w-4 h-4" />}
              {...register('phone')}
              disabled={saving}
            />

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Rol actual</p>
                <p className="text-xs text-[var(--text-tertiary)]">Lo asigna un administrador del ministerio</p>
              </div>
              <Badge variant="brand" size="sm">
                {getRoleLabel(profile?.role)}
              </Badge>
            </div>

            {isMusician && (
              <fieldset className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                <legend className="text-sm font-medium text-[var(--text-primary)]">Instrumentos</legend>
                <p className="text-xs text-[var(--text-tertiary)]">Marca lo que tocas; puedes elegir más de uno.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {INSTRUMENT_OPTIONS.map((opt) => {
                    const active = instruments.includes(opt.value)
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
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              Preferencias de Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Switch
              label="Notificaciones por email"
              description="Emails de asignaciones, recordatorios y listas"
              {...register('email_enabled')}
              disabled={saving}
            />
            <Switch
              label="Avisos dentro de la app"
              description="Nuevos privilegios, alabanzas y asignaciones en la pestaña Avisos"
              {...register('push_enabled')}
              disabled={saving}
            />

            <div className="pt-3 border-t border-[var(--border-subtle)]">
              <Label htmlFor="assignment_reminder_hours">Recordatorio antes del evento (horas)</Label>
              <Input
                id="assignment_reminder_hours"
                type="number"
                inputMode="numeric"
                min="1"
                max="168"
                error={errors.assignment_reminder_hours?.message}
                hint="Entre 1 y 168 horas (7 días)."
                {...register('assignment_reminder_hours', { valueAsNumber: true })}
                disabled={saving}
                className="sm:w-32"
              />
            </div>
          </CardContent>
        </Card>

        {/* Desktop save button (phones use the sticky bar below) */}
        <div className="hidden sm:flex justify-end">
          <Button type="submit" loading={saving} disabled={!isDirty}>
            <Save className="w-4 h-4" />
            Guardar cambios
          </Button>
        </div>

        {/* Phones: sticky save bar above the bottom nav, only while there are changes */}
        {isDirty && (
          <div className="sm:hidden fixed inset-x-0 z-[260] bottom-[calc(var(--bottom-nav-h)+var(--safe-bottom))] border-t border-[var(--border-normal)] bg-[var(--bg-page)]/95 backdrop-blur-md px-4 py-3 animate-slide-in">
            <Button type="submit" className="w-full" loading={saving}>
              <Save className="w-4 h-4" />
              Guardar cambios
            </Button>
          </div>
        )}
      </form>

      {/* Danger zone */}
      <Card className="border-[var(--color-error)]/20 bg-[var(--color-error)]/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-[var(--color-error)]">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Estas acciones son irreversibles.</p>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={saving} fullWidthMobile>
            <Trash2 className="w-4 h-4" />
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        tone="danger"
        size="sm"
        title="Eliminar cuenta"
        dismissible={!saving}
        icon={
          <div className="w-8 h-8 rounded-full bg-[var(--color-error)]/20 text-[var(--color-error)] flex items-center justify-center">
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          </div>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} loading={saving}>
              Sí, eliminar mi cuenta
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)]">
          ¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción es irreversible: perderás tu acceso y
          la asignación de privilegios pasados.
        </p>
      </Modal>
    </div>
  )
}

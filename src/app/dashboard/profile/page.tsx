'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui'
import { User, Mail, Phone, Bell, Save, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
  email_enabled: z.boolean(),
  push_enabled: z.boolean(),
  assignment_reminder_hours: z.number().min(1).max(168),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, session, refreshSession } = useAuth()
  const supabase = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<{
    full_name: string
    phone: string | null
    role: string
    email_enabled: boolean
    push_enabled: boolean
    assignment_reminder_hours: number
  } | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      email_enabled: true,
      push_enabled: true,
      assignment_reminder_hours: 24,
    },
    mode: 'onChange',
  })

  useEffect(() => {
    if (user) fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, role')
        .eq('id', user?.id)
        .single()

      const { data: prefsData } = await supabase
        .from('notification_preferences')
        .select('email_enabled, push_enabled, assignment_reminder_hours')
        .eq('profile_id', user?.id)
        .single()

      if (profileData) {
        const merged = {
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          role: profileData.role,
          email_enabled: prefsData?.email_enabled ?? true,
          push_enabled: prefsData?.push_enabled ?? true,
          assignment_reminder_hours: prefsData?.assignment_reminder_hours ?? 24,
        }
        setProfile(merged)
        Object.entries(merged).forEach(([key, value]) => {
          setValue(key as keyof ProfileForm, value)
        })
      }
    } catch {
      // Quiet failover
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: data.full_name, phone: data.phone || null })
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
      toast({ title: 'Guardado', description: 'Perfil actualizado correctamente', variant: 'success' })
    } catch (err) {
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
      window.location.href = '/login'
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar la cuenta', variant: 'destructive' })
      setSaving(false)
      setShowDeleteModal(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 border-3 border-brand-200 dark:border-brand-800 rounded-full" />
          <div className="absolute inset-0 border-3 border-brand-500 rounded-full animate-spin border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-white tracking-tight">Mi Perfil</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.full_name?.message}
              leadingIcon={<User className="w-5 h-5" />}
              {...register('full_name')}
              disabled={saving}
            />

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={user?.email || ''}
              disabled
              leadingIcon={<Mail className="w-5 h-5" />}
              className="bg-neutral-50 dark:bg-neutral-800"
            />

            <Input
              label="Teléfono"
              type="tel"
              placeholder="+503 7123-4567"
              error={errors.phone?.message}
              leadingIcon={<Phone className="w-5 h-5" />}
              {...register('phone')}
              disabled={saving}
            />

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Rol actual</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 capitalize">{profile?.role || 'singer'}</p>
                </div>
                <Badge variant="brand" size="sm">
                  {profile?.role || 'singer'}
                </Badge>
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" loading={saving} disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-500" />
            Preferencias de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Notificaciones por Email</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Recibir emails para asignaciones, recordatorios y listas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('email_enabled')}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/30 dark:peer-focus:ring-brand-500/50 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-neutral-900 dark:text-white">Notificaciones Push (en la app)</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Recibir alertas en tiempo real en la aplicación</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('push_enabled')}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-500/30 dark:peer-focus:ring-brand-500/50 rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-neutral-600 peer-checked:bg-brand-600"></div>
                </label>
              </div>

              <div>
                <Label htmlFor="assignment_reminder_hours">Recordatorio antes del evento (horas)</Label>
                <Input
                  id="assignment_reminder_hours"
                  type="number"
                  min="1"
                  max="168"
                  error={errors.assignment_reminder_hours?.message}
                  {...register('assignment_reminder_hours', { valueAsNumber: true })}
                  disabled={saving}
                  className="w-32"
                />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" loading={saving} disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" />
              Guardar preferencias
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/20 bg-error/5 dark:bg-error/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <AlertCircle className="w-5 h-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-error mb-4">Estas acciones son irreversibles.</p>
          <Button variant="destructive" onClick={() => setShowDeleteModal(true)} disabled={saving} loading={saving}>
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-md bg-[var(--bg-raised)] border border-error/20 rounded-[var(--radius-xl)] shadow-2xl overflow-hidden animate-scale-in text-[var(--text-primary)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-6 py-4 border-b border-error/20 bg-error/5">
              <div className="w-8 h-8 rounded-full bg-error/20 text-error flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-error">Eliminar cuenta</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                ¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción es irreversible, se perderá tu acceso y la asignación de privilegios pasados.
              </p>
              
              <div className="flex justify-end gap-3 pt-4 mt-2">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} loading={saving}>
                  Sí, eliminar mi cuenta
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
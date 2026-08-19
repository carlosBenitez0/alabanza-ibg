'use client'

export const dynamic = 'force-dynamic'

import { useAuth } from '@/components/providers/auth-provider'
import { useSupabase } from '@/hooks/use-supabase'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { User, Mail, Phone, Bell, Save, Loader2 } from 'lucide-react'
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
    } catch (err) {
      console.error(err)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.full_name?.message}
              {...register('full_name')}
              disabled={saving}
            />

            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              value={user?.email || ''}
              disabled
              className="bg-secondary"
            />

            <div className="relative">
              <Input
                label="Teléfono"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                error={errors.phone?.message}
                {...register('phone')}
                disabled={saving}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rol actual</p>
                  <p className="text-sm text-muted-foreground capitalize">{profile?.role || 'singer'}</p>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                  {profile?.role || 'singer'}
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" loading={saving} disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" />
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Preferencias de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones por Email</p>
                  <p className="text-sm text-muted-foreground">Recibir emails para asignaciones, recordatorios y listas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('email_enabled')}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificaciones Push (en la app)</p>
                  <p className="text-sm text-muted-foreground">Recibir alertas en tiempo real en la aplicación</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('push_enabled')}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
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

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <User className="w-5 h-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">Estas acciones son irreversibles.</p>
          <Button variant="destructive" onClick={() => {}}>
            Eliminar mi cuenta
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
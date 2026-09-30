'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/providers/toast-provider'
import { Button, Input, PageLoader, buttonVariants } from '@/components/ui'
import { AuthCard, AuthAlert, PasswordChecklist } from '@/components/auth/auth-card'
import { passwordSchema } from '@/lib/password'
import { getAuthErrorMessage } from '@/lib/utils'

const schema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

/**
 * Reached from the recovery email via /auth/callback, which has already
 * signed the user in with a short-lived recovery session.
 */
export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useSupabase()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })
  const password = useWatch({ control, name: 'password' }) || ''

  const onSubmit = async ({ password }: FormValues) => {
    setSaving(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password }).catch((e: Error) => ({ error: e }))
    setSaving(false)
    if (error) {
      setError(
        error.message.includes('different from the old')
          ? 'La nueva contraseña debe ser distinta de la anterior.'
          : getAuthErrorMessage(error.message)
      )
      return
    }
    toast({ title: 'Contraseña actualizada', description: 'Ya puedes usarla para iniciar sesión.', variant: 'success' })
    router.replace('/dashboard')
    router.refresh()
  }

  if (authLoading) return <PageLoader fullScreen />

  if (!user) {
    return (
      <AuthCard title="Enlace no válido" subtitle="No pudimos verificar tu solicitud">
        <AuthAlert tone="error">
          El enlace de recuperación expiró o ya se usó. Los enlaces sirven una sola vez y por tiempo limitado.
        </AuthAlert>
        <Link href="/forgot-password" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          Pedir un enlace nuevo
        </Link>
      </AuthCard>
    )
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  )

  return (
    <AuthCard title="Nueva contraseña" subtitle={`Para ${user.email}`}>
      {error && <AuthAlert tone="error">{error}</AuthAlert>}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Lets password managers attach the new password to the right account */}
        <input type="email" name="email" autoComplete="username" value={user.email ?? ''} readOnly hidden />
        <div>
          <Input
            id="new-password"
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            error={errors.password?.message}
            leadingIcon={<Lock className="w-4 h-4" />}
            trailingAction={toggle}
            disabled={saving}
            required
            {...register('password')}
          />
          <PasswordChecklist password={password} />
        </div>
        <Input
          id="confirm-password"
          label="Confirmar contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          enterKeyHint="done"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          leadingIcon={<Lock className="w-4 h-4" />}
          disabled={saving}
          required
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" className="w-full" loading={saving}>
          Guardar nueva contraseña
        </Button>
      </form>
    </AuthCard>
  )
}

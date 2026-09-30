'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ArrowLeft } from 'lucide-react'
import { useSupabase } from '@/hooks/use-supabase'
import { Button, Input, PageLoader } from '@/components/ui'
import { AuthCard, AuthAlert, authLinkClass } from '@/components/auth/auth-card'
import { getAuthErrorMessage } from '@/lib/utils'

const schema = z.object({
  email: z.string().trim().min(1, 'El email es requerido').email('Ingresa un correo electrónico válido'),
})

type FormValues = z.infer<typeof schema>

function ForgotPasswordContent() {
  const supabase = useSupabase()
  const searchParams = useSearchParams()
  const linkExpired = searchParams.get('expired') === '1'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sentTo, setSentTo] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onChange' })

  const onSubmit = async ({ email }: FormValues) => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth
      .resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      })
      .catch((e: Error) => ({ error: e }))
    setLoading(false)
    if (error) {
      setError(getAuthErrorMessage(error.message))
      return
    }
    // Same message whether or not the account exists, so emails can't be probed
    setSentTo(email)
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva"
      footer={
        <Link href="/login" className={authLinkClass}>
          <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          Volver a iniciar sesión
        </Link>
      }
    >
      {linkExpired && !sentTo && (
        <AuthAlert tone="error">El enlace de recuperación expiró o ya se usó. Pide uno nuevo.</AuthAlert>
      )}
      {error && <AuthAlert tone="error">{error}</AuthAlert>}

      {sentTo ? (
        <div className="space-y-4">
          <AuthAlert tone="success">
            Si existe una cuenta con <strong>{sentTo}</strong>, te llegará un correo en unos minutos. Abre el enlace
            desde este mismo dispositivo para elegir tu nueva contraseña.
          </AuthAlert>
          <p className="text-sm text-[var(--text-tertiary)]">
            ¿No llega? Revisa la carpeta de spam o{' '}
            <button type="button" className="underline underline-offset-4 text-[var(--text-primary)] py-3 -my-3" onClick={() => setSentTo('')}>
              inténtalo de nuevo
            </button>
            .
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            id="email"
            label="Email de tu cuenta"
            type="email"
            inputMode="email"
            autoComplete="email"
            enterKeyHint="send"
            placeholder="tu@email.com"
            error={errors.email?.message}
            leadingIcon={<Mail className="w-4 h-4" />}
            disabled={loading}
            required
            {...register('email')}
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Enviar enlace de recuperación
          </Button>
        </form>
      )}
    </AuthCard>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <ForgotPasswordContent />
    </Suspense>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabase } from '@/hooks/use-supabase'
import { Button, Input } from '@/components/ui'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const supabase = useSupabase()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setError(error.message)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Bienvenido', description: 'Has iniciado sesión correctamente', variant: 'success' })
      router.push(redirectTo)
      router.refresh()
    }
    setLoading(false)
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = (e.currentTarget as HTMLFormElement).elements.namedItem('email') as HTMLInputElement
    if (!email.value) {
      toast({ title: 'Error', description: 'Ingresa tu email', variant: 'destructive' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
    })

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Revisa tu email', description: 'Te enviamos un enlace mágico para iniciar sesión', variant: 'success' })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/ibglogo.png" alt="IBG Logo" className="h-10 w-auto" />
            <span className="text-2xl font-bold text-primary">Alabanza IBG</span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Iniciar Sesión</h1>
          <p className="text-muted-foreground mt-2">Accede a tu panel de ministerio</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
              disabled={loading}
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-4">
            <Input
              name="email"
              label="Email para enlace mágico"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
            />
            <Button type="submit" variant="outline" className="w-full" loading={loading}>
              <Mail className="w-4 h-4 mr-2" />
              Enviar enlace mágico
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <LoginPageContent />
    </Suspense>
  )
}
"use client";

export const dynamic = "force-dynamic";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/use-supabase";
import { Button, Input } from "@/components/ui";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Music,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { useGsapMountReveal } from "@/hooks/use-gsap-reveal";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "El email es requerido")
    .email("Ingresa un correo electrónico válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const magicLinkSchema = z.object({
  magicEmail: z
    .string()
    .trim()
    .min(1, "El email es requerido")
    .email("Ingresa un correo electrónico válido"),
});

type LoginForm = z.infer<typeof loginSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const justRegistered = searchParams.get("registered") === "true";
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cardRef = useGsapMountReveal<HTMLDivElement>({
    from: "bottom",
    duration: 0.6,
    yOffset: 30,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const {
    register: registerMagic,
    handleSubmit: handleMagicSubmit,
    formState: { errors: magicErrors },
  } = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    mode: "onChange",
  });

  const supabase = useSupabase();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      let msg = error.message;
      if (error.message === "Supabase not configured") {
        msg =
          "Supabase no está configurado. Falta crear el archivo .env.local con las credenciales de tu proyecto Supabase.";
      } else if (error.message.includes("Invalid login credentials")) {
        msg = "Credenciales incorrectas (email o contraseña no válidos)";
      }
      setError(msg);
      toast({
        title: "Error de ingreso",
        description: msg,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
        variant: "success",
      });
      router.push(redirectTo);
      router.refresh();
    }
    setLoading(false);
  };

  const onMagicLinkSubmit = async (data: MagicLinkForm) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: data.magicEmail,
      options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
    });

    if (error) {
      const msg =
        error.message === "Supabase not configured"
          ? "Supabase no está configurado en .env.local."
          : error.message;
      toast({ title: "Error", description: msg, variant: "destructive" });
    } else {
      toast({
        title: "Revisa tu email",
        description: `Te enviamos un enlace mágico a ${data.magicEmail}`,
        variant: "success",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] px-4 py-12 text-[var(--text-primary)]">
      <div ref={cardRef} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--text-primary)] text-[var(--text-inverse)] flex items-center justify-center font-bold">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Alabanza IBG
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Accede a tu panel de ministerio
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--bg-raised)] rounded-[var(--radius-xl)] border border-[var(--border-normal)] p-8 space-y-6">
          {justRegistered && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-success-dark)]/20 border border-[var(--color-success)]/30 flex items-center gap-2.5"
              role="status"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[var(--color-success)]" />
              <p className="text-xs text-[var(--color-success)]">
                ¡Cuenta creada exitosamente! Por favor inicia sesión.
              </p>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error-dark)]/20 border border-[var(--color-error)]/30 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--color-error)] mt-0.5" />
              <p className="text-xs text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <Input
              label="Email"
              type="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              leadingIcon={<Mail className="w-4 h-4" />}
              {...register("email")}
              disabled={loading}
              autoComplete="email"
              required
            />

            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              leadingIcon={<Lock className="w-4 h-4" />}
              trailingAction={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors focus:outline-none"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
              {...register("password")}
              disabled={loading}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={loading}
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border-subtle)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[var(--bg-raised)] text-[var(--text-tertiary)] font-mono">
                O entra con
              </span>
            </div>
          </div>

          {/* Magic Link */}
          <form
            onSubmit={handleMagicSubmit(onMagicLinkSubmit)}
            className="space-y-3"
            noValidate
          >
            <Input
              label="Email para enlace mágico"
              type="email"
              placeholder="tu@email.com"
              error={magicErrors.magicEmail?.message}
              leadingIcon={<Mail className="w-4 h-4" />}
              {...registerMagic("magicEmail")}
              autoComplete="email"
              disabled={loading}
            />
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              loading={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar enlace mágico
            </Button>
          </form>

          <p className="pt-2 text-center text-xs text-[var(--text-tertiary)]">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-[var(--text-primary)] hover:underline font-medium transition-colors"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-2 border-[var(--border-strong)] rounded-full" />
            <div className="absolute inset-0 border-2 border-[var(--text-primary)] rounded-full animate-spin border-t-transparent" />
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

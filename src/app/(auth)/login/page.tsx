"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthErrorMessage, safeRedirect } from "@/lib/utils";
import { resendSignupConfirmation } from "@/lib/auth-email";
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

type LoginForm = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirectTo"));
  const justRegistered = searchParams.get("registered") === "true";
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Password login was rejected because the signup email was never confirmed
  const [unconfirmed, setUnconfirmed] = useState(false);

  const authErrorParam = searchParams.get("error");
  const isExpired = authErrorParam === "otp_expired" || authErrorParam === "access_denied" || authErrorParam === "invalid_link" || authErrorParam === "expired";

  const cardRef = useGsapMountReveal<HTMLDivElement>({
    from: "bottom",
    duration: 0.6,
    yOffset: 30,
  });

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });
  const [sendingLink, setSendingLink] = useState(false);

  const supabase = useSupabase();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");
    setUnconfirmed(false);

    const { error } = await supabase.auth
      .signInWithPassword({ email: data.email, password: data.password })
      .catch((e: Error) => ({ error: e }));

    if (error) {
      const msg = getAuthErrorMessage(error.message);
      setError(msg);
      setUnconfirmed(error.message.includes("Email not confirmed"));
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

  // Unconfirmed accounts can't sign in with a password, so an expired
  // confirmation link needs a fresh email, not a login attempt
  const [resending, setResending] = useState(false);
  const resendConfirmation = async () => {
    const email = getValues("email")?.trim();
    if (!email) {
      toast({ title: "Escribe tu email", description: "Ingresa tu correo en el campo Email y vuelve a pulsar Reenviar.", variant: "warning" });
      return;
    }
    setResending(true);
    const errorMessage = await resendSignupConfirmation(supabase, email);
    setResending(false);
    if (errorMessage) {
      toast({ title: "No se pudo reenviar", description: getAuthErrorMessage(errorMessage), variant: "destructive" });
    } else {
      toast({ title: "Correo reenviado", description: `Revisa ${email} y abre el enlace nuevo (el anterior ya no sirve).`, variant: "success" });
    }
  };

  // Passwordless sign-in to the same email typed above (no second email field)
  const sendMagicLink = async () => {
    if (!(await trigger("email"))) return;
    const email = getValues("email").trim();
    setSendingLink(true);
    const { error } = await supabase.auth
      .signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      .catch((e: Error) => ({ error: e }));
    setSendingLink(false);

    if (error) {
      toast({ title: "No se pudo enviar el enlace", description: getAuthErrorMessage(error.message), variant: "destructive" });
    } else {
      toast({ title: "Revisa tu correo", description: `Te enviamos un enlace para entrar a ${email}.`, variant: "success" });
    }
  };

  return (
    <div className="min-h-dvh flex items-start sm:items-center justify-center bg-[var(--bg-page)] px-4 pt-[calc(2rem+var(--safe-top))] pb-[calc(2rem+var(--safe-bottom))] sm:py-12 text-[var(--text-primary)]">
      <div ref={cardRef} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4 min-h-11">
            <Image src="/ibglogo.png" alt="" width={28} height={48} priority className="h-10 w-auto" />
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Alabanza IBG
            </span>
          </Link>
          <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Accede a tu panel de ministerio
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--bg-raised)] rounded-[var(--radius-xl)] border border-[var(--border-normal)] p-5 sm:p-8 space-y-5 sm:space-y-6">
          {justRegistered && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-success-dark)]/20 border border-[var(--color-success)]/30 flex items-start gap-2.5"
              role="status"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[var(--color-success)] mt-0.5" />
              <p className="text-sm text-[var(--color-success)]">
                ¡Cuenta creada! Antes de iniciar sesión, abre el enlace que te enviamos por correo para confirmar tu cuenta.
              </p>
            </div>
          )}

          {isExpired && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error-dark)]/20 border border-[var(--color-error)]/30 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--color-error)] mt-0.5" />
              <div className="space-y-2 min-w-0">
                <p className="text-sm text-[var(--color-error)]">
                  El enlace del correo expiró o ya se usó. Si ya confirmaste tu cuenta, inicia sesión con tu contraseña.
                  Si no, escribe tu email abajo y pide un enlace nuevo.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={resendConfirmation} loading={resending} fullWidthMobile>
                  <Mail className="w-4 h-4" />
                  Reenviar correo de confirmación
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error-dark)]/20 border border-[var(--color-error)]/30 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--color-error)] mt-0.5" />
              <div className="space-y-2 min-w-0">
                <p className="text-sm text-[var(--color-error)]">{error}</p>
                {unconfirmed && !isExpired && (
                  <Button type="button" variant="outline" size="sm" onClick={resendConfirmation} loading={resending} fullWidthMobile>
                    <Mail className="w-4 h-4" />
                    Reenviar correo de confirmación
                  </Button>
                )}
              </div>
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
                  className="rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--focus-ring)]"
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
            <div className="-mt-2 flex justify-end">
              <Link
                href="/forgot-password"
                className="inline-flex items-center min-h-11 px-1 text-sm text-[var(--text-secondary)] underline-offset-4 hover:underline hover:text-[var(--text-primary)] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={loading}
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Passwordless: uses the email already typed above */}
          <div className="pt-5 border-t border-[var(--border-subtle)] space-y-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={sendMagicLink}
              loading={sendingLink}
              disabled={loading}
            >
              <Mail className="w-4 h-4" />
              Enviarme un enlace para entrar
            </Button>
            <p className="text-xs text-center text-[var(--text-tertiary)]">
              Sin contraseña: te llega un enlace al correo que escribiste arriba.
            </p>
          </div>

          <p className="pt-2 text-center text-sm text-[var(--text-tertiary)]">
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="inline-flex items-center min-h-11 px-1 text-[var(--text-primary)] underline-offset-4 hover:underline font-medium transition-colors"
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
        <div className="min-h-dvh flex items-center justify-center bg-[var(--bg-page)]">
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthErrorMessage } from "@/lib/utils";
import { getWebmailFor, resendSignupConfirmation } from "@/lib/auth-email";
import { passwordSchema } from "@/lib/password";
import { PasswordChecklist } from "@/components/auth/auth-card";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/use-supabase";
import { Button, Input, buttonVariants } from "@/components/ui";
import { useToast } from "@/components/providers/toast-provider";
import {
  Mail,
  MailCheck,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useGsapMountReveal } from "@/hooks/use-gsap-reveal";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres"),
    email: z
      .string()
      .trim()
      .min(1, "El email es requerido")
      .email("Ingresa un correo electrónico válido"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirma tu contraseña"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim().length >= 8,
        "El teléfono debe tener al menos 8 dígitos",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Email the confirmation link was sent to; switches the card to the "check your inbox" step
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const cardRef = useGsapMountReveal<HTMLDivElement>({ yOffset: 12 });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  const supabase = useSupabase();

  // Real-time password criteria state
  const password = useWatch({ control, name: "password" }) || "";


  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } = await supabase.auth
      .signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
      .catch((e: Error) => ({ data: { user: null }, error: e }));

    if (authError) {
      setError(getAuthErrorMessage(authError.message));
    } else if (authData.user?.identities?.length === 0) {
      setError("Este email ya está registrado");
    } else if (authData.session) {
      // Email confirmation is disabled in Supabase: the user is already signed in
      router.push("/dashboard");
      router.refresh();
      return;
    } else {
      setSentTo(data.email.trim());
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!sentTo) return;
    setResending(true);
    const errorMessage = await resendSignupConfirmation(supabase, sentTo);
    setResending(false);
    if (errorMessage) {
      toast({ title: "No se pudo reenviar", description: getAuthErrorMessage(errorMessage), variant: "destructive" });
    } else {
      toast({ title: "Correo reenviado", description: `Revisa ${sentTo} y abre el enlace nuevo (el anterior ya no sirve).`, variant: "success" });
    }
  };

  const webmail = sentTo ? getWebmailFor(sentTo) : null;

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
            {sentTo ? "Confirma tu correo" : "Crear Cuenta"}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            {sentTo ? "Un último paso para activar tu cuenta" : "Únete a tu ministerio de alabanza"}
          </p>
        </div>

        {sentTo ? (
          <div
            className="bg-[var(--bg-raised)] rounded-[var(--radius-xl)] border border-[var(--border-normal)] p-5 sm:p-8 space-y-5"
            role="status"
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 shrink-0 rounded-[var(--radius-md)] bg-[var(--color-success-dark)]/30 border border-[var(--color-success)]/30 flex items-center justify-center">
                <MailCheck className="w-5 h-5 text-[var(--color-success)]" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1.5">
                <p className="font-semibold text-[var(--text-primary)]">Revisa tu correo</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  Te enviamos un enlace de confirmación a{" "}
                  <strong className="text-[var(--text-primary)] break-all">{sentTo}</strong>. Ábrelo para activar tu
                  cuenta; hasta entonces no podrás iniciar sesión.
                </p>
                <p className="text-xs text-[var(--text-tertiary)]">
                  ¿No lo ves? Busca en Spam o Promociones. Puede tardar un par de minutos.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {webmail && (
                <a
                  href={webmail.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: "lg", className: "w-full" })}
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir {webmail.name}
                </a>
              )}
              <Button
                variant={webmail ? "outline" : "primary"}
                size="lg"
                className="w-full"
                onClick={handleResend}
                loading={resending}
              >
                <Mail className="w-4 h-4" />
                Reenviar correo
              </Button>
            </div>

            <p className="pt-1 text-center text-sm text-[var(--text-tertiary)]">
              ¿Ya confirmaste?{" "}
              <Link
                href="/login"
                className="inline-flex items-center min-h-11 px-1 text-[var(--text-primary)] underline-offset-4 hover:underline font-medium transition-colors"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        ) : (
        /* Form Card */
        <div className="bg-[var(--bg-raised)] rounded-[var(--radius-xl)] border border-[var(--border-normal)] p-5 sm:p-8 space-y-5 sm:space-y-6">
          {error && (
            <div
              className="p-3 rounded-[var(--radius-md)] bg-[var(--color-error-dark)]/20 border border-[var(--color-error)]/30 flex items-start gap-2.5"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-[var(--color-error)] mt-0.5" />
              <p className="text-sm text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Full Name */}
            <Input
              label="Nombre completo"
              placeholder="Juan Pérez"
              error={errors.fullName?.message}
              leadingIcon={<User className="w-4 h-4" />}
              {...register("fullName")}
              disabled={loading}
              autoComplete="name"
              required
            />

            {/* Email */}
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

            {/* Password */}
            <div>
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
                autoComplete="new-password"
                required
              />

              <PasswordChecklist password={password} />
            </div>

            {/* Confirm Password */}
            <Input
              label="Confirmar contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              leadingIcon={<Lock className="w-4 h-4" />}
              {...register("confirmPassword")}
              disabled={loading}
              autoComplete="new-password"
              required
            />

            {/* Phone (Optional) */}
            <Input
              label="Teléfono (opcional)"
              type="tel"
              placeholder="+503 7123-4567"
              error={errors.phone?.message}
              leadingIcon={<Phone className="w-4 h-4" />}
              {...register("phone")}
              disabled={loading}
              autoComplete="tel"
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={loading}
            >
              Crear Cuenta
            </Button>
          </form>

          <p className="pt-2 text-center text-sm text-[var(--text-tertiary)]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="inline-flex items-center min-h-11 px-1 text-[var(--text-primary)] underline-offset-4 hover:underline font-medium transition-colors"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
        )}
      </div>
    </div>
  );
}

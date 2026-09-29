"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthErrorMessage } from "@/lib/utils";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSupabase } from "@/hooks/use-supabase";
import { Button, Input } from "@/components/ui";
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
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
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir al menos una letra mayúscula")
      .regex(/[a-z]/, "Debe incluir al menos una letra minúscula")
      .regex(/[0-9]/, "Debe incluir al menos un número"),
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

  const passwordCriteria = [
    { label: "Mínimo 8 caracteres", met: password.length >= 8 },
    { label: "Una letra mayúscula (A-Z)", met: /[A-Z]/.test(password) },
    { label: "Una letra minúscula (a-z)", met: /[a-z]/.test(password) },
    { label: "Un número (0-9)", met: /[0-9]/.test(password) },
  ];

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
    } else {
      router.push("/login?registered=true");
    }
    setLoading(false);
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
            Crear Cuenta
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Únete a tu ministerio de alabanza
          </p>
        </div>

        {/* Form Card */}
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

              {/* Password Requirements Live Checklist */}
              <div className="mt-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                <p className="text-caption font-mono text-[var(--text-tertiary)] uppercase tracking-wider mb-1">
                  Requisitos de contraseña:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {passwordCriteria.map((c, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 text-sm sm:text-xs"
                    >
                      {c.met ? (
                        <Check className="w-3.5 h-3.5 text-[var(--color-success)] flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-[var(--text-tertiary)] flex-shrink-0" />
                      )}
                      <span
                        className={
                          c.met
                            ? "text-[var(--color-success)] font-medium"
                            : "text-[var(--text-tertiary)]"
                        }
                      >
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
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
      </div>
    </div>
  );
}

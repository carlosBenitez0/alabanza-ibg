import { z } from 'zod'

/** Same rules for sign-up and password reset */
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'Debe incluir al menos una letra mayúscula')
  .regex(/[a-z]/, 'Debe incluir al menos una letra minúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número')

/** Live checklist shown under the password field */
export function getPasswordCriteria(password: string) {
  return [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Una letra mayúscula (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Una letra minúscula (a-z)', met: /[a-z]/.test(password) },
    { label: 'Un número (0-9)', met: /[0-9]/.test(password) },
  ]
}

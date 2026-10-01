import type { Instrument, UserRole } from '@/types'

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'singer', label: 'Cantante', description: 'Registra sus privilegios de canto y ve la tabla semanal.' },
  { value: 'musician', label: 'Músico', description: 'Acompaña a los cantantes; se muestra con su instrumento.' },
  { value: 'admin', label: 'Administrador', description: 'Panel de administración: roles, instrumentos y asignaciones.' },
]

export const INSTRUMENT_OPTIONS: { value: Instrument; label: string }[] = [
  { value: 'guitar', label: 'Guitarrista' },
  { value: 'drums', label: 'Baterista' },
  { value: 'trumpet', label: 'Trompetista' },
  { value: 'piano', label: 'Pianista' },
  { value: 'bass', label: 'Bajista' },
]

export function getRoleLabel(role?: string | null): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? 'Cantante'
}

export function getInstrumentLabels(instruments?: string[] | null): string {
  return (instruments || [])
    .map((i) => INSTRUMENT_OPTIONS.find((o) => o.value === i)?.label ?? i)
    .join(', ')
}

/** A musician's instrument is their role: "Guitarrista, Pianista" (plain "Músico" until the admin picks one) */
export function getRoleWithInstruments(role?: string | null, instruments?: string[] | null): string {
  const list = role === 'musician' ? getInstrumentLabels(instruments) : ''
  return list || getRoleLabel(role)
}

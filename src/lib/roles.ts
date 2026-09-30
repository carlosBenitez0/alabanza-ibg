import type { Instrument, UserRole } from '@/types'

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'singer', label: 'Cantante', description: 'Registra sus privilegios de canto y ve la tabla semanal.' },
  { value: 'musician', label: 'Músico', description: 'Ve los privilegios de los cantantes y sus alabanzas para acompañarlos.' },
  { value: 'leader', label: 'Líder', description: 'Acceso al panel de administración y eventos.' },
  { value: 'admin', label: 'Administrador', description: 'Todo lo anterior y puede cambiar roles.' },
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

/** "Músico · Guitarrista, Pianista" when the musician chose instruments */
export function getRoleWithInstruments(role?: string | null, instruments?: string[] | null): string {
  const label = getRoleLabel(role)
  const list = role === 'musician' ? getInstrumentLabels(instruments) : ''
  return list ? `${label} · ${list}` : label
}

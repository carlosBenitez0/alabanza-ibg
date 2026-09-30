export const ALL_MUSIC_KEYS = [
  // Tonos Mayores
  { code: 'C', label: 'C (Do)' },
  { code: 'C#', label: 'C# / Db (Do#)' },
  { code: 'D', label: 'D (Re)' },
  { code: 'Eb', label: 'D# / Eb (Re#)' },
  { code: 'E', label: 'E (Mi)' },
  { code: 'F', label: 'F (Fa)' },
  { code: 'F#', label: 'F# / Gb (Fa#)' },
  { code: 'G', label: 'G (Sol)' },
  { code: 'Ab', label: 'G# / Ab (Sol#)' },
  { code: 'A', label: 'A (La)' },
  { code: 'Bb', label: 'A# / Bb (La#)' },
  { code: 'B', label: 'B (Si)' },
  // Tonos Menores
  { code: 'Cm', label: 'Cm (Do m)' },
  { code: 'C#m', label: 'C#m / Dbm (Do# m)' },
  { code: 'Dm', label: 'Dm (Re m)' },
  { code: 'Ebm', label: 'D#m / Ebm (Re# m)' },
  { code: 'Em', label: 'Em (Mi m)' },
  { code: 'Fm', label: 'Fm (Fa m)' },
  { code: 'F#m', label: 'F#m / Gbm (Fa# m)' },
  { code: 'Gm', label: 'Gm (Sol m)' },
  { code: 'Abm', label: 'G#m / Abm (Sol# m)' },
  { code: 'Am', label: 'Am (La m)' },
  { code: 'Bbm', label: 'A#m / Bbm (La# m)' },
  { code: 'Bm', label: 'Bm (Si m)' },
]

export function getKeyLabel(code?: string | null): string | null {
  if (!code) return null
  return ALL_MUSIC_KEYS.find((k) => k.code === code)?.label ?? code
}

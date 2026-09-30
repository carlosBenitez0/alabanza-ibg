/**
 * Chord transposition for "chords over lyrics" sheets (plain text aligned with
 * spaces, like LaCuerda). Only lines made of chords are rewritten, and every
 * chord keeps its column so it stays above the right syllable.
 */
import { ALL_MUSIC_KEYS } from '@/lib/music-keys'

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

// Root, quality (m, maj7, Maj7, sus4, dim, aug, add9, 6/9, 7, 9, 11, 13, °, ø, +, (b9), (add9), (maj7)...),
// optional slash bass. "/9" in 6/9 is part of the quality; "/B" is a bass note.
const QUALITY_TOKEN = String.raw`maj|Maj|min|dim|aug|sus|add|m|M|°|º|ø|\+|-|#|b|\d|\/\d+`
const PAREN_GROUP = String.raw`\((?:maj|Maj|min|dim|aug|sus|add|m|M|[#b+-]|\d|,)+\)`
const CHORD_RE = new RegExp(String.raw`^([A-G])([#b]?)((?:${QUALITY_TOKEN}|${PAREN_GROUP})*)(?:\/([A-G])([#b]?))?$`)

// Tokens that may sit on a chord line without making it a lyric line
const FILLER_RE = /^(?:\|+|:?\|\|?:?|-+|\/+|\.+|\*+|%|x\d+|\(x?\d+\)|n\.?c\.?|[A-Za-zÁÉÍÓÚáéíóúÑñ]+\s*\d*:)$/i

const mod12 = (n: number) => ((n % 12) + 12) % 12

function noteIndex(letter: string, accidental: string): number {
  const base = NATURAL[letter]
  return mod12(base + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0))
}

export function isChord(token: string): boolean {
  return CHORD_RE.test(token)
}

/** Strips wrapping punctuation like "(C)", "[G]" or "Am," around a chord. */
function splitWrapped(token: string): { pre: string; core: string; post: string } {
  const pre = /^[([]*/.exec(token)![0]
  let core = token.slice(pre.length)
  let post = ''
  const count = (s: string, ch: string) => s.split(ch).length - 1
  // Only strip a ")" that closes a wrapper, never the one of "F(add9)"
  while (core) {
    const last = core[core.length - 1]
    const wrapperParen = last === ')' && count(core, ')') > count(core, '(')
    if (last !== ',' && last !== ']' && !wrapperParen) break
    post = last + post
    core = core.slice(0, -1)
  }
  return { pre, core, post }
}

function isChordToken(token: string): boolean {
  const { core } = splitWrapped(token)
  if (!core) return false
  // "C-F-G" style runs
  return core.split('-').every((part) => part === '' || isChord(part)) && core.replace(/-/g, '') !== ''
}

export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  let chords = 0
  for (const token of tokens) {
    if (isChordToken(token)) chords++
    else if (!FILLER_RE.test(token)) return false
  }
  return chords > 0
}

export function transposeChord(chord: string, semitones: number, preferFlats: boolean): string {
  const m = CHORD_RE.exec(chord)
  if (!m) return chord
  const names = preferFlats ? FLAT_NAMES : SHARP_NAMES
  const [, root, rootAcc, quality, bass, bassAcc] = m
  const newRoot = names[mod12(noteIndex(root, rootAcc) + semitones)]
  const newBass = bass ? `/${names[mod12(noteIndex(bass, bassAcc) + semitones)]}` : ''
  return `${newRoot}${quality}${newBass}`
}

function transposeToken(token: string, semitones: number, preferFlats: boolean): string {
  const { pre, core, post } = splitWrapped(token)
  if (!isChordToken(token)) return token
  const moved = core
    .split('-')
    .map((part) => (part ? transposeChord(part, semitones, preferFlats) : part))
    .join('-')
  return `${pre}${moved}${post}`
}

/** Rewrites a chord line keeping each chord's starting column (at least one space between chords). */
function transposeChordLine(line: string, semitones: number, preferFlats: boolean): string {
  let out = ''
  for (const match of line.matchAll(/\S+/g)) {
    const col = match.index ?? 0
    const token = transposeToken(match[0], semitones, preferFlats)
    if (out.length < col) out += ' '.repeat(col - out.length)
    else if (out.length > 0) out += ' '
    out += token
  }
  return out
}

/** Inline [C] chords (ChordPro style) inside lyric lines. */
function transposeInline(line: string, semitones: number, preferFlats: boolean): string {
  return line.replace(/\[([^\]\s]+)\]/g, (whole, inner: string) =>
    isChord(inner) ? `[${transposeChord(inner, semitones, preferFlats)}]` : whole
  )
}

export function transposeSheet(text: string, semitones: number, preferFlats: boolean): string {
  if (mod12(semitones) === 0 || !text) return text
  return text
    .split(/\r?\n/)
    .map((line) =>
      isChordLine(line)
        ? transposeChordLine(line, semitones, preferFlats)
        : transposeInline(line, semitones, preferFlats)
    )
    .join('\n')
}

// ─── Keys ───

export interface ParsedKey {
  index: number
  minor: boolean
}

export function parseKey(code?: string | null): ParsedKey | null {
  if (!code) return null
  const m = /^([A-G])([#b]?)(m?)$/.exec(code.trim())
  if (!m) return null
  return { index: noteIndex(m[1], m[2]), minor: m[3] === 'm' }
}

/** Key code used by ALL_MUSIC_KEYS for a pitch class and mode (e.g. 3 + major → "Eb"). */
export function keyCodeFor(index: number, minor: boolean): string {
  const found = ALL_MUSIC_KEYS.find((k) => {
    const parsed = parseKey(k.code)
    return parsed && parsed.index === mod12(index) && parsed.minor === minor
  })
  return found ? found.code : `${SHARP_NAMES[mod12(index)]}${minor ? 'm' : ''}`
}

/** Flat keys read better with flat chord names (Bb, Eb...), the rest with sharps. */
export function keyPrefersFlats(code?: string | null): boolean {
  if (!code) return false
  if (code.includes('b')) return true
  return ['F', 'Dm', 'Gm', 'Cm', 'Fm'].includes(code)
}

/** Semitones to go from one key to another, normalized to -5..6 (the shortest move). */
export function semitonesBetween(from?: string | null, to?: string | null): number {
  const a = parseKey(from)
  const b = parseKey(to)
  if (!a || !b) return 0
  const diff = mod12(b.index - a.index)
  return diff > 6 ? diff - 12 : diff
}

export function shiftKey(code: string | null | undefined, semitones: number): string | null {
  const parsed = parseKey(code)
  if (!parsed) return null
  return keyCodeFor(parsed.index + semitones, parsed.minor)
}

export function normalizeShift(semitones: number): number {
  const s = mod12(semitones)
  return s > 6 ? s - 12 : s
}

'use client'

import { useState, useEffect } from 'react'
import { CatalogSong } from '@/types/privileges'
import { useSupabase } from '@/hooks/use-supabase'
import { saveLocalSong } from '@/lib/song-storage'
import { Button, Badge, Textarea, Modal } from '@/components/ui'
import { FileText, CheckCircle2, Edit3, Copy, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, Download, WrapText, Minus, Plus, RotateCcw, Save } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { ALL_MUSIC_KEYS, getKeyLabel } from '@/lib/music-keys'
import { keyPrefersFlats, normalizeShift, parseKey, semitonesBetween, shiftKey, transposeSheet } from '@/lib/chords'
import { downloadTablaturePdf, pdfFileName } from '@/lib/tablature-pdf'
import { cn } from '@/lib/utils'

// Safari (iPad, older iOS) still exposes the webkit-prefixed Fullscreen API
type WebkitDocument = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> | void }
type WebkitElement = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }

function getFullscreenElement(): Element | null {
  const doc = document as WebkitDocument
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function requestBrowserFullscreen(): Promise<boolean> {
  const el = document.documentElement as WebkitElement
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen()
    else return false
    return Boolean(getFullscreenElement())
  } catch {
    return false // Not allowed here (e.g. iPhone Safari): the CSS stage layout still applies
  }
}

function exitBrowserFullscreen() {
  const doc = document as WebkitDocument
  const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc)
  Promise.resolve(exit?.()).catch(() => {})
}

// The "add to home screen" hint is shown once per visit
let stageHintShown = false

function isStandaloneApp(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches
}

interface TablatureModalProps {
  song: CatalogSong | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  /** Key to show the sheet in when opened (e.g. the key chosen for a privilege) */
  initialKey?: string | null
}

export function TablatureModal({ song, isOpen, onClose, onSuccess, initialKey }: TablatureModalProps) {
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSizeIndex, setFontSizeIndex] = useState(1) // 0: text-xs, 1: text-sm, 2: text-base, 3: text-lg, 4: text-xl
  const [tabContent, setTabContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  // Chord sheets rely on column alignment, so lines scroll sideways unless the user opts in
  const [wrapLines, setWrapLines] = useState(false)
  // Key the saved sheet is written in, and how many semitones it is shown shifted
  const [baseKey, setBaseKey] = useState<string | null>(null)
  const [shift, setShift] = useState(0)
  const [confirmKeySave, setConfirmKeySave] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fontSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']

  // Reset the viewer whenever a different song is opened (during render, not in an effect)
  const [shownSong, setShownSong] = useState<CatalogSong | null>(null)
  if (song !== shownSong) {
    setShownSong(song)
    if (song) {
      setTabContent(song.tablature_content || '')
      setIsEditing(!song.has_tablature && !song.tablature_content)
      setIsFullscreen(false)
      setBaseKey(song.default_key || null)
      setShift(semitonesBetween(song.default_key, initialKey))
      setConfirmKeySave(false)
    }
  }

  // Stage mode: keep the phone screen awake while reading chords
  useEffect(() => {
    if (!isOpen || !isFullscreen || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request('screen')
        if (cancelled) lock.release()
      } catch {
        // Not allowed (battery saver, unsupported browser): stage mode still works
      }
    }
    const onVisible = () => document.visibilityState === 'visible' && request()
    request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [isOpen, isFullscreen])

  // Stage mode also asks the browser for real fullscreen, hiding its address bar and
  // bottom toolbar on phones. Leaving fullscreen (back gesture, Esc) leaves stage mode.
  useEffect(() => {
    if (!isOpen || !isFullscreen) return
    const onChange = () => {
      if (!getFullscreenElement()) setIsFullscreen(false)
    }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
      // Closing the modal or leaving stage mode drops browser fullscreen too
      if (getFullscreenElement()) exitBrowserFullscreen()
    }
  }, [isOpen, isFullscreen])

  const toggleStageMode = async () => {
    if (isFullscreen) {
      setIsFullscreen(false)
      return
    }
    // Must run inside the click handler: browsers only grant fullscreen on a user gesture
    const entered = await requestBrowserFullscreen()
    setIsFullscreen(true)
    if (!entered && !isStandaloneApp() && !stageHintShown) {
      stageHintShown = true
      toast({
        title: 'Pantalla completa limitada',
        description: 'Este navegador no deja ocultar sus barras. Agrega la app a tu pantalla de inicio para verla sin ellas.',
      })
    }
  }

  if (!song) return null

  const viewKey = shiftKey(baseKey, shift)
  const displayContent = transposeSheet(tabContent, shift, keyPrefersFlats(viewKey))
  const keyText = getKeyLabel(viewKey ?? baseKey) ?? 'Sin tono'
  const baseMode = parseKey(baseKey)
  const keyOptions = baseMode ? ALL_MUSIC_KEYS.filter((k) => parseKey(k.code)?.minor === baseMode.minor) : []
  const shiftLabel = shift > 0 ? `+${shift}` : `${shift}`

  const changeShift = (next: number) => {
    setShift(normalizeShift(next))
    setConfirmKeySave(false)
  }

  const handleSaveInKey = async () => {
    const content = displayContent.trim()
    const newKey = viewKey ?? baseKey
    setLoading(true)
    saveLocalSong({ ...song, has_tablature: true, tablature_content: content, default_key: newKey })
    let failed = false
    if (song.id && !song.id.startsWith('def_') && !song.id.startsWith('song_')) {
      const { error } = await supabase
        .from('songs')
        .update({ has_tablature: true, tablature_content: content, default_key: newKey })
        .eq('id', song.id)
      failed = Boolean(error)
    }
    setLoading(false)
    setConfirmKeySave(false)
    if (failed) {
      toast({ title: 'No se pudo guardar', description: 'Revisa tu conexión e inténtalo de nuevo.', variant: 'destructive' })
      return
    }
    setTabContent(content)
    setBaseKey(newKey)
    setShift(0)
    toast({ title: 'Tono guardado', description: `"${song.title}" quedó guardada en ${getKeyLabel(newKey) ?? 'el nuevo tono'}.`, variant: 'success' })
    onSuccess()
  }

  const handleCopy = () => {
    if (!displayContent) return
    navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copiado', description: 'Tablatura copiada al portapapeles', variant: 'success' })
  }

  const handleExportPDF = async () => {
    if (!displayContent || exporting) return
    setExporting(true)
    try {
      await downloadTablaturePdf({
        title: song.title,
        keyLabel: keyText,
        content: displayContent,
        fileName: pdfFileName(song.title, viewKey ?? baseKey),
      })
    } catch {
      toast({ title: 'No se pudo crear el PDF', description: 'Inténtalo de nuevo en unos segundos.', variant: 'destructive' })
    } finally {
      setExporting(false)
    }
  }

  const handleSaveTablature = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const updatedSong: CatalogSong = {
      ...song,
      has_tablature: Boolean(tabContent.trim()),
      tablature_content: tabContent.trim() || null,
    }

    saveLocalSong(updatedSong)

    try {
      if (song.id && !song.id.startsWith('def_') && !song.id.startsWith('song_')) {
        await supabase
          .from('songs')
          .update({
            has_tablature: Boolean(tabContent.trim()),
            tablature_content: tabContent.trim() || null,
          })
          .eq('id', song.id)
      }
    } catch {
      // Quiet fallback
    } finally {
      toast({
        title: 'Tablatura guardada',
        description: `Se han guardado los acordes/tablatura para "${song.title}".`,
        variant: 'success',
      })
      setIsEditing(false)
      onSuccess()
      setLoading(false)
    }
  }

  const toolButton =
    'shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 min-w-11 sm:min-h-9 sm:min-w-9 px-2.5 rounded-[var(--radius-md)] border border-[var(--border-normal)] bg-[var(--bg-surface)] text-sm sm:text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] disabled:opacity-30 transition-colors'

  const viewToolbar = (
    <div className="scroll-x flex items-center gap-2 -mx-1 px-1" role="toolbar" aria-label="Herramientas de tablatura">
      <button
        type="button"
        className={toolButton}
        onClick={() => setFontSizeIndex((prev) => Math.max(0, prev - 1))}
        disabled={fontSizeIndex === 0}
        aria-label="Reducir letra"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={toolButton}
        onClick={() => setFontSizeIndex((prev) => Math.min(fontSizes.length - 1, prev + 1))}
        disabled={fontSizeIndex === fontSizes.length - 1}
        aria-label="Aumentar letra"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        className={cn(toolButton, wrapLines && 'text-[var(--text-primary)] border-[var(--text-secondary)]')}
        onClick={() => setWrapLines((w) => !w)}
        aria-pressed={wrapLines}
      >
        <WrapText className="w-4 h-4" aria-hidden="true" />
        <span>Ajustar</span>
      </button>
      {tabContent && (
        <>
          <button type="button" className={toolButton} onClick={handleCopy}>
            {copied ? <Check className="w-4 h-4 text-[var(--color-success)]" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
          <button
            type="button"
            className={toolButton}
            onClick={handleExportPDF}
            disabled={exporting}
            aria-busy={exporting}
            aria-label="Descargar PDF"
          >
            <Download className={cn('w-4 h-4', exporting && 'animate-pulse')} aria-hidden="true" />
            <span>{exporting ? 'Creando…' : 'PDF'}</span>
          </button>
        </>
      )}
      <button
        type="button"
        className={toolButton}
        onClick={() => {
          // The editor holds the sheet in its saved key
          changeShift(0)
          setIsEditing(true)
        }}
      >
        <Edit3 className="w-4 h-4" aria-hidden="true" />
        <span>Editar</span>
      </button>
    </div>
  )

  const keyBar = tabContent && (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Cambiar tono">
        <span className="text-caption font-mono uppercase tracking-wider text-[var(--text-tertiary)]">Tono</span>
        <button type="button" className={toolButton} onClick={() => changeShift(shift - 1)} aria-label="Bajar medio tono">
          <Minus className="w-4 h-4" aria-hidden="true" />
        </button>
        {keyOptions.length > 0 ? (
          <select
            value={viewKey ?? ''}
            onChange={(e) => changeShift(semitonesBetween(baseKey, e.target.value))}
            aria-label="Tono de la tablatura"
            className="min-h-11 sm:min-h-9 bg-[var(--bg-surface)] border border-[var(--border-normal)] text-[var(--text-primary)] rounded-[var(--radius-md)] text-base sm:text-xs px-2 font-mono focus:outline-none focus:border-[var(--text-primary)]"
          >
            {keyOptions.map((k) => (
              <option key={k.code} value={k.code} className="bg-[var(--bg-raised)] text-[var(--text-primary)]">
                {k.label}{k.code === baseKey ? ' · original' : ''}
              </option>
            ))}
          </select>
        ) : (
          <span className="min-w-11 text-center font-mono text-sm" aria-live="polite">
            {shift === 0 ? 'Original' : shiftLabel}
          </span>
        )}
        <button type="button" className={toolButton} onClick={() => changeShift(shift + 1)} aria-label="Subir medio tono">
          <Plus className="w-4 h-4" aria-hidden="true" />
        </button>
        {shift !== 0 && (
          <>
            <button type="button" className={toolButton} onClick={() => changeShift(0)}>
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Original</span>
            </button>
            <button type="button" className={toolButton} onClick={() => setConfirmKeySave(true)} disabled={loading}>
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>Guardar en este tono</span>
            </button>
          </>
        )}
      </div>
      {confirmKeySave && (
        <div
          role="alert"
          className="p-3 rounded-[var(--radius-md)] border border-[var(--color-warning)]/40 bg-[var(--color-warning-dark)]/20 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3"
        >
          <p className="text-sm text-[var(--text-primary)] flex-1">
            {viewKey
              ? `La tablatura se guardará en ${getKeyLabel(viewKey)} para todos.`
              : `La tablatura se guardará ${shiftLabel} semitonos para todos.`}{' '}
            <span className="text-[var(--text-tertiary)]">Siempre se puede volver a transponer.</span>
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setConfirmKeySave(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveInKey} loading={loading}>
              Guardar
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const editFooter = (
    <>
      {song.tablature_content && (
        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
          Cancelar
        </Button>
      )}
      <Button type="submit" form="tab-form" loading={loading}>
        <CheckCircle2 className="w-4 h-4" />
        Guardar Tablatura
      </Button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      fullscreen={isFullscreen}
      fullscreenMobile
      dismissible={!loading}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {song.title}
          <Badge variant="brand" size="sm" className="font-mono">{keyText}</Badge>
        </span>
      }
      description={isFullscreen ? 'Modo escenario · la pantalla se mantiene encendida' : 'Acordes y tablatura del ministerio'}
      icon={
        <div className="hidden sm:flex w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] items-center justify-center">
          <FileText className="w-5 h-5 text-[var(--text-primary)]" aria-hidden="true" />
        </div>
      }
      headerActions={
        !isEditing && (
          <button
            type="button"
            onClick={toggleStageMode}
            className="touch-target sm:min-h-9 sm:min-w-9 flex items-center justify-center rounded-[var(--radius)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
            aria-label={isFullscreen ? 'Salir del modo escenario' : 'Modo escenario'}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        )
      }
      footer={isEditing ? editFooter : viewToolbar}
      bodyClassName={cn(!isEditing && 'px-3 sm:px-6')}
    >
      {!isEditing ? (
        tabContent ? (
          <>
            {keyBar}
            <pre
              className={cn(
                'p-4 sm:p-5 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border-subtle)] font-mono text-[var(--text-primary)] leading-relaxed overflow-x-auto overscroll-x-contain',
                wrapLines ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
                fontSizes[fontSizeIndex]
              )}
            >
              {displayContent}
            </pre>
          </>
        ) : (
          <div className="p-6 sm:p-8 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-sm text-[var(--text-tertiary)] space-y-4">
            <FileText className="w-8 h-8 mx-auto" aria-hidden="true" />
            <p>No se ha agregado la tablatura/acordes para esta canción aún.</p>
            <Button onClick={() => setIsEditing(true)} fullWidthMobile>
              <Edit3 className="w-4 h-4" />
              Agregar Tablatura / Acordes
            </Button>
          </div>
        )
      ) : (
        <form id="tab-form" onSubmit={handleSaveTablature} className="h-full flex flex-col">
          <Textarea
            id="tab-content"
            label="Pegar o escribir los acordes / tablatura"
            placeholder={`Intro: C - F - C - F\n\nVerso:\nC                      F             C\nTe amo Dios, Tu misericordia nunca me ha fallado...`}
            value={tabContent}
            onChange={(e) => setTabContent(e.target.value)}
            rows={14}
            disabled={loading}
            className="font-mono text-base sm:text-xs whitespace-pre min-h-[50dvh]"
            wrap="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            required
          />
        </form>
      )}
    </Modal>
  )
}

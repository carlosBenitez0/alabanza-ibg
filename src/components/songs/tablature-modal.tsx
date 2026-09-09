'use client'

import { useState, useEffect } from 'react'
import { CatalogSong } from '@/types/privileges'
import { useSupabase } from '@/hooks/use-supabase'
import { saveLocalSong } from '@/lib/song-storage'
import { Button, Badge, Textarea } from '@/components/ui'
import { Music, FileText, X, CheckCircle2, Edit3, Copy, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, Printer } from 'lucide-react'
import { useToast } from '@/components/providers/toast-provider'
import { ALL_MUSIC_KEYS } from '@/components/privileges/song-autocomplete'
import { cn } from '@/lib/utils'

interface TablatureModalProps {
  song: CatalogSong | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TablatureModal({ song, isOpen, onClose, onSuccess }: TablatureModalProps) {
  const supabase = useSupabase()
  const { toast } = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSizeIndex, setFontSizeIndex] = useState(1) // 0: text-xs, 1: text-sm, 2: text-base, 3: text-lg, 4: text-xl
  const [tabContent, setTabContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const fontSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl']

  useEffect(() => {
    if (song) {
      setTabContent(song.tablature_content || '')
      setIsEditing(!song.has_tablature && !song.tablature_content)
      setIsFullscreen(false)
    }
  }, [song])

  if (!isOpen || !song) return null

  const getKeyLabel = (code?: string | null) => {
    if (!code) return 'C'
    const found = ALL_MUSIC_KEYS.find(k => k.code === code)
    return found ? found.label : code
  }

  const handleCopy = () => {
    if (!tabContent) return
    navigator.clipboard.writeText(tabContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Copiado', description: 'Tablatura copiada al portapapeles', variant: 'success' })
  }

  const handleExportPDF = () => {
    if (!tabContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast({
        title: 'Error de ventanas emergentes',
        description: 'Por favor, permite las ventanas emergentes para exportar a PDF.',
        variant: 'destructive',
      })
      return
    }

    const keyLabel = getKeyLabel(song.default_key)

    printWindow.document.write(`
      <html>
        <head>
          <title>${song.title} - Tablatura</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #000;
              background: #fff;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
            }
            .key-badge {
              font-family: monospace;
              font-size: 14px;
              font-weight: bold;
              background: #f0f0f0;
              border: 1px solid #ccc;
              padding: 4px 8px;
              border-radius: 4px;
            }
            .subtitle {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            .content {
              font-family: Consolas, Monaco, "Courier New", Courier, monospace;
              font-size: 14px;
              white-space: pre-wrap;
              line-height: 1.6;
              overflow-wrap: break-word;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${song.title}</h1>
              <div class="subtitle">Ministerio de Alabanza IBG</div>
            </div>
            <div class="key-badge">Tono: ${keyLabel}</div>
          </div>
          <pre class="content">${tabContent}</pre>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
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

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in',
      isFullscreen ? 'p-0' : 'p-4'
    )}>
      <div
        className={cn(
          'relative bg-[var(--bg-raised)] border border-[var(--border-normal)] shadow-2xl flex flex-col overflow-hidden text-[var(--text-primary)] transition-all duration-300',
          isFullscreen
            ? 'w-screen h-screen rounded-none border-none max-w-none max-h-none'
            : 'w-full max-w-2xl max-h-[90vh] rounded-[var(--radius-xl)] animate-scale-in'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--bg-surface)] border border-[var(--border-normal)] flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText className="w-5 h-5 text-[var(--text-primary)]" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-[var(--text-primary)] leading-tight break-words">
                  {song.title}
                </h2>
                <Badge variant="brand" size="sm" className="whitespace-nowrap flex-shrink-0 font-mono">
                  {getKeyLabel(song.default_key)}
                </Badge>
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">
                Acordes y Tablatura del Ministerio {isFullscreen && '• Modo Escenario / Pantalla Completa'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {/* Fullscreen Toggle Button */}
            {!isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFullscreen(!isFullscreen)}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                title={isFullscreen ? 'Salir de pantalla completa' : 'Modo Escenario / Pantalla Completa'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-[var(--text-primary)]" /> : <Maximize2 className="w-4 h-4 text-[var(--text-secondary)]" />}
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors flex-shrink-0"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isEditing ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                  Cifrado y Acordes:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Font Size Controls */}
                  <div className="flex items-center gap-1 bg-[var(--bg-surface)] border border-[var(--border-normal)] rounded-[var(--radius-md)] p-1">
                    <button
                      type="button"
                      onClick={() => setFontSizeIndex(prev => Math.max(0, prev - 1))}
                      disabled={fontSizeIndex === 0}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                      title="Reducir letra"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-[var(--text-secondary)] uppercase">
                      Letra
                    </span>
                    <button
                      type="button"
                      onClick={() => setFontSizeIndex(prev => Math.min(fontSizes.length - 1, prev + 1))}
                      disabled={fontSizeIndex === fontSizes.length - 1}
                      className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                      title="Aumentar letra"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button variant="ghost" size="sm" className="text-xs h-8 px-2.5 whitespace-nowrap" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5 mr-1 text-[var(--color-success)]" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </Button>
                  {tabContent && (
                    <Button variant="outline" size="sm" className="text-xs h-8 px-2.5 whitespace-nowrap" onClick={handleExportPDF}>
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Exportar PDF
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-xs h-8 px-2.5 whitespace-nowrap" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1" />
                    Editar Tablatura
                  </Button>
                </div>
              </div>

              {tabContent ? (
                <pre className={cn(
                  'p-5 rounded-[var(--radius-md)] bg-[var(--bg-page)] border border-[var(--border-subtle)] font-mono text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed overflow-x-auto select-all transition-all duration-150',
                  fontSizes[fontSizeIndex]
                )}>
                  {tabContent}
                </pre>
              ) : (
                <div className="p-8 rounded-[var(--radius-md)] border border-dashed border-[var(--border-normal)] text-center text-xs text-[var(--text-tertiary)] space-y-3">
                  <FileText className="w-8 h-8 text-[var(--text-tertiary)] mx-auto" />
                  <p>No se ha agregado la tablatura/acordes para esta canción aún.</p>
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                    Agregar Tablatura / Acordes
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveTablature} className="space-y-4">
              <Textarea
                label="Pegar o Escribir los Acordes / Tablatura *"
                placeholder={`Intro: C - F - C - F\n\nVerso:\nC                      F             C\nTe amo Dios, Tu misericordia nunca me ha fallado...`}
                value={tabContent}
                onChange={(e) => setTabContent(e.target.value)}
                rows={12}
                disabled={loading}
                className="font-mono text-xs"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                {song.tablature_content && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)} disabled={loading}>
                    Cancelar
                  </Button>
                )}
                <Button type="submit" size="sm" loading={loading}>
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Guardar Tablatura
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]">
          <span className="text-xs font-mono text-[var(--text-tertiary)]">
            {isFullscreen ? 'Presiona Esc o el icono para salir del modo escenario' : 'Alabanza IBG'}
          </span>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  )
}

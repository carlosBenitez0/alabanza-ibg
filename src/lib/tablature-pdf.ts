import { isChordLine } from '@/lib/chords'

const PT_TO_MM = 0.3528
// Courier glyphs are 0.6 em wide, which is what keeps chords aligned over lyrics
const COURIER_EM = 0.6

const A4 = { width: 210, height: 297 }
const MARGIN = 15

export function pdfFileName(title: string, keyCode?: string | null): string {
  const slug = title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const key = keyCode ? `-${keyCode.replace('#', 's')}` : ''
  return `${slug || 'tablatura'}${key}.pdf`
}

/**
 * Builds a text PDF (selectable, small) of a chord sheet and downloads it
 * directly, without the browser print dialog. jsPDF is loaded on demand.
 */
export async function downloadTablaturePdf({
  title,
  keyLabel,
  content,
  fileName,
}: {
  title: string
  keyLabel: string
  content: string
  fileName: string
}) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const usable = A4.width - MARGIN * 2
  const bottom = A4.height - MARGIN

  // ─── Header ───
  doc.setTextColor(10)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  const titleLines: string[] = doc.splitTextToSize(title, usable - 45)
  let y = MARGIN + 6
  doc.text(titleLines, MARGIN, y)
  y += (titleLines.length - 1) * 7

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Tono: ${keyLabel}`, A4.width - MARGIN, MARGIN + 6, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text('Ministerio de Alabanza IBG', MARGIN, y + 5.5)

  y += 9
  doc.setDrawColor(10)
  doc.setLineWidth(0.4)
  doc.line(MARGIN, y, A4.width - MARGIN, y)
  y += 8

  // ─── Body ───
  const lines = content.replace(/\t/g, '    ').split(/\r?\n/)
  const longest = Math.max(1, ...lines.map((l) => l.trimEnd().length))
  const fontSize = Math.min(11, Math.max(7, usable / (longest * COURIER_EM * PT_TO_MM)))
  const lineHeight = fontSize * PT_TO_MM * 1.4
  const columns = Math.floor(usable / (fontSize * COURIER_EM * PT_TO_MM))
  doc.setFontSize(fontSize)
  doc.setTextColor(10)

  const newPage = () => {
    doc.addPage()
    y = MARGIN + 4
  }

  lines.forEach((raw, i) => {
    const line = raw.trimEnd()
    const chordLine = isChordLine(line)
    // Keep a chord line on the same page as the lyric under it
    const needed = chordLine && i + 1 < lines.length ? lineHeight * 2 : lineHeight
    if (y + needed > bottom) newPage()

    doc.setFont('courier', chordLine ? 'bold' : 'normal')
    // Only lines longer than the page at the smallest size get split
    const chunks = line.length > columns ? line.match(new RegExp(`.{1,${columns}}`, 'g')) ?? [line] : [line]
    chunks.forEach((chunk, c) => {
      if (c > 0 && y + lineHeight > bottom) newPage()
      if (chunk) doc.text(chunk, MARGIN, y)
      y += lineHeight
    })
  })

  // ─── Page numbers ───
  const pages = doc.getNumberOfPages()
  if (pages > 1) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(130)
    for (let p = 1; p <= pages; p++) {
      doc.setPage(p)
      doc.text(`${title} · ${p}/${pages}`, A4.width - MARGIN, A4.height - 8, { align: 'right' })
    }
  }

  doc.save(fileName)
}

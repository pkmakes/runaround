import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type Konva from 'konva'
import type { PathRow } from '../../state/store'
import { manhattanLength } from '../geometry'

export function exportPdfCombined(
  stage: Konva.Stage | null,
  paths: PathRow[],
  pathOrder: string[]
): void {
  if (!stage) {
    alert('Stage nicht verfügbar')
    return
  }

  const doc = new jsPDF('landscape', 'mm', 'a4')
  const dateStr = new Date().toLocaleDateString('de-DE')

  // === SEITE 1: Diagramm (Querformat) ===
  const dataUrl = stage.toDataURL({ pixelRatio: 2 })

  // A4 landscape dimensions in mm
  const pageWidthLandscape = 297
  const pageHeightLandscape = 210
  const margin = 10

  // Add title
  doc.setFontSize(14)
  doc.text('Runaround - Diagramm', margin, margin + 5)
  doc.setFontSize(9)
  doc.text(`Erstellt am: ${dateStr}`, margin, margin + 11)

  // Calculate image dimensions to fit within margins
  const availableWidth = pageWidthLandscape - margin * 2
  const availableHeight = pageHeightLandscape - margin * 2 - 18 // Extra space for title

  // Get original stage dimensions
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const aspectRatio = stageWidth / stageHeight

  let imgWidth = availableWidth
  let imgHeight = imgWidth / aspectRatio

  if (imgHeight > availableHeight) {
    imgHeight = availableHeight
    imgWidth = imgHeight * aspectRatio
  }

  const x = margin + (availableWidth - imgWidth) / 2
  const y = margin + 18

  doc.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight)

  // === SEITE 2+: Tabelle (Hochformat) ===
  if (paths.length > 0) {
    // Neue Seite im Hochformat hinzufügen
    doc.addPage('a4', 'portrait')

    const orderedPaths = pathOrder
      .map((id) => paths.find((p) => p.id === id))
      .filter((p): p is PathRow => p !== undefined)

    doc.setFontSize(14)
    doc.text('Runaround - Laufwege', 14, 15)
    doc.setFontSize(9)
    doc.text(`Erstellt am: ${dateStr}`, 14, 21)

    const tableData = orderedPaths.map((path, index) => [
      index + 1,
      path.fields.description || '-',
      path.fields.knackpunkt || '-',
      path.fields.begruendung || '-',
      path.fields.kommentar || '-',
      manhattanLength(path.points) + ' px',
    ])

    autoTable(doc, {
      startY: 28,
      head: [['Nr.', 'Beschreibung', 'Knackpunkt', 'Begründung', 'Kommentar', 'Distanz']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [95, 179, 179], // Angepasst an das neue Farbschema
        textColor: 255,
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 20 },
      },
    })
  }

  doc.save(`runaround-${new Date().toISOString().slice(0, 10)}.pdf`)
}


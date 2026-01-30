import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { PathRow } from '../../state/store'
import { manhattanLength } from '../geometry'

export function exportPdfTable(paths: PathRow[], pathOrder: string[]): void {
  const orderedPaths = pathOrder
    .map((id) => paths.find((p) => p.id === id))
    .filter((p): p is PathRow => p !== undefined)

  const doc = new jsPDF('portrait', 'mm', 'a4')

  doc.setFontSize(16)
  doc.text('Spaghetti Diagram - Laufwege', 14, 15)
  doc.setFontSize(10)
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 22)

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
      fillColor: [233, 69, 96],
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

  doc.save(`spaghetti-laufwege-${new Date().toISOString().slice(0, 10)}.pdf`)
}


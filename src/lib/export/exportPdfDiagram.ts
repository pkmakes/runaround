import jsPDF from 'jspdf'
import Konva from 'konva'

export function exportPdfDiagram(stage: Konva.Stage | null): void {
  if (!stage) {
    alert('Stage nicht verfügbar')
    return
  }

  const dataUrl = stage.toDataURL({ pixelRatio: 2 })

  // A4 landscape dimensions in mm
  const pageWidth = 297
  const pageHeight = 210
  const margin = 10

  const doc = new jsPDF('landscape', 'mm', 'a4')

  // Add title
  doc.setFontSize(12)
  doc.text('Spaghetti Diagram', margin, margin + 5)
  doc.setFontSize(8)
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, margin, margin + 10)

  // Calculate image dimensions to fit within margins
  const availableWidth = pageWidth - margin * 2
  const availableHeight = pageHeight - margin * 2 - 15 // Extra space for title

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
  const y = margin + 15

  doc.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight)

  doc.save(`spaghetti-diagramm-${new Date().toISOString().slice(0, 10)}.pdf`)
}


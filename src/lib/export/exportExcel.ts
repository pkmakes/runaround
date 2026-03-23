import * as XLSX from 'xlsx'
import type { PathRow, RectNode, DockSide } from '../../state/store'
import { manhattanLength } from '../geometry'
import { buildExportBaseName } from '../persistence/saveLoad'

function formatDockSide(side: DockSide): string {
  switch (side) {
    case 'top':
      return 'oben'
    case 'right':
      return 'rechts'
    case 'bottom':
      return 'unten'
    case 'left':
      return 'links'
    default:
      // Fallback für unerwartete Werte
      console.warn('Unerwarteter DockSide-Wert:', side)
      return String(side)
  }
}

function formatPathEndpoint(
  rectId: string,
  side: DockSide,
  rects: RectNode[]
): string {
  const rect = rects.find((r) => r.id === rectId)
  const rectName = rect?.name || 'Unbekannt'
  // Debug: Prüfe den tatsächlichen Wert von side
  if (typeof side !== 'string' || !['top', 'right', 'bottom', 'left'].includes(side)) {
    console.warn('Ungültiger side-Wert:', side, 'für rectId:', rectId)
  }
  const sideName = formatDockSide(side)
  return `${rectName} (${sideName})`
}

export function exportExcel(
  paths: PathRow[],
  pathOrder: string[],
  rects: RectNode[],
  projectName = ''
): void {
  const orderedPaths = pathOrder
    .map((id) => paths.find((p) => p.id === id))
    .filter((p): p is PathRow => p !== undefined)

  const data = orderedPaths.map((path, index) => ({
    'Nr.': index + 1,
    'Beschreibung': path.fields.description,
    'Knackpunkt': path.fields.knackpunkt,
    'Begründung': path.fields.begruendung,
    'Kommentar': path.fields.kommentar,
    'Distanz (px)': manhattanLength(path.points),
    'Start': formatPathEndpoint(path.from.rectId, path.from.side, rects),
    'End': formatPathEndpoint(path.to.rectId, path.to.side, rects),
  }))

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laufwege')

  // Auto-width columns
  const colWidths = [
    { wch: 5 },
    { wch: 30 },
    { wch: 20 },
    { wch: 30 },
    { wch: 30 },
    { wch: 12 },
    { wch: 25 },
    { wch: 25 },
  ]
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${buildExportBaseName(projectName)}.xlsx`)
}


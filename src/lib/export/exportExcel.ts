import * as XLSX from 'xlsx'
import type { PathRow } from '../../state/store'
import { manhattanLength } from '../geometry'

export function exportExcel(paths: PathRow[], pathOrder: string[]): void {
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
  ]
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `runaround-laufwege-${new Date().toISOString().slice(0, 10)}.xlsx`)
}


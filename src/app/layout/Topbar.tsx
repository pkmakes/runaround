import { useRef } from 'react'
import { useStore } from '../../state/store'
import { downloadProjectJson, loadProjectJson } from '../../lib/persistence/saveLoad'
import { exportExcel } from '../../lib/export/exportExcel'
import { exportPdfTable } from '../../lib/export/exportPdfTable'
import { exportPdfDiagram } from '../../lib/export/exportPdfDiagram'
import { stageRef } from '../../canvas/stageRef'

export function Topbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reset = useStore((s) => s.reset)
  const setState = useStore((s) => s.setState)
  const paths = useStore((s) => s.paths)
  const pathOrder = useStore((s) => s.pathOrder)

  const getState = () => useStore.getState()

  const handleNew = () => {
    if (confirm('Neues Projekt erstellen? Alle Änderungen gehen verloren.')) {
      reset()
    }
  }

  const handleSave = () => {
    const state = getState()
    downloadProjectJson(state)
  }

  const handleLoad = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const data = await loadProjectJson(file)
        setState({
          room: data.room,
          rects: data.rects,
          paths: data.paths,
          pathOrder: data.pathOrder,
          ui: { mode: 'layout', pendingStart: null, selectedRectId: null },
        })
      } catch (err) {
        alert('Fehler beim Laden der Datei: ' + (err instanceof Error ? err.message : 'Unbekannter Fehler'))
      }
    }
    e.target.value = ''
  }

  const handleExportExcel = () => {
    if (paths.length === 0) {
      alert('Keine Laufwege zum Exportieren vorhanden.')
      return
    }
    exportExcel(paths, pathOrder)
  }

  const handleExportPdfTable = () => {
    if (paths.length === 0) {
      alert('Keine Laufwege zum Exportieren vorhanden.')
      return
    }
    exportPdfTable(paths, pathOrder)
  }

  const handleExportPdfDiagram = () => {
    exportPdfDiagram(stageRef.current)
  }

  return (
    <header className="topbar">
      <h1>🍝 Spaghetti Diagram Builder</h1>
      <button className="topbar-btn" onClick={handleNew}>
        Neu
      </button>
      <button className="topbar-btn" onClick={handleSave}>
        Speichern
      </button>
      <button className="topbar-btn" onClick={handleLoad}>
        Laden
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="file-input-hidden"
        onChange={handleFileChange}
      />
      <button className="topbar-btn" onClick={handleExportExcel}>
        Export Excel
      </button>
      <button className="topbar-btn" onClick={handleExportPdfTable}>
        Export PDF (Tabelle)
      </button>
      <button className="topbar-btn" onClick={handleExportPdfDiagram}>
        Export PDF (Diagramm)
      </button>
    </header>
  )
}

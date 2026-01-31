import { useRef } from 'react'
import { useStore } from '../../state/store'
import { downloadProjectJson, loadProjectJson } from '../../lib/persistence/saveLoad'
import { exportExcel } from '../../lib/export/exportExcel'
import { exportPdfCombined } from '../../lib/export/exportPdfCombined'
import { stageRef } from '../../canvas/stageRef'

export function Topbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reset = useStore((s) => s.reset)
  const setState = useStore((s) => s.setState)
  const paths = useStore((s) => s.paths)
  const pathOrder = useStore((s) => s.pathOrder)
  const hasUnsavedChanges = useStore((s) => s.hasUnsavedChanges)
  const markAsSaved = useStore((s) => s.markAsSaved)

  const getState = () => useStore.getState()

  const handleNew = () => {
    if (confirm('Neues Projekt erstellen? Alle Änderungen gehen verloren.')) {
      reset()
    }
  }

  const handleSave = () => {
    const state = getState()
    downloadProjectJson(state)
    markAsSaved()
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
          hasUnsavedChanges: false,
          ui: { mode: 'layout', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: null, hoveredPathId: null },
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

  const handleExportPdf = () => {
    exportPdfCombined(stageRef.current, paths, pathOrder)
  }

  return (
    <header className="topbar">
      <h1>
        Runaround
        {hasUnsavedChanges && <span className="unsaved-indicator" title="Ungespeicherte Änderungen">●</span>}
      </h1>
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
      <button className="topbar-btn" onClick={handleExportPdf}>
        Export PDF
      </button>
    </header>
  )
}

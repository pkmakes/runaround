import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from '../../state/store'
import { useUIMode, useRoom, useSelectedRectId, useRects, useRectFontSize, usePathThickness } from '../../state/selectors'
import { routePath } from '../../lib/routing/router'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const mode = useUIMode()
  const room = useRoom()
  const selectedRectId = useSelectedRectId()
  const rects = useRects()
  const rectFontSize = useRectFontSize()
  const pathThickness = usePathThickness()
  const setMode = useStore((s) => s.setMode)
  const setRoomSize = useStore((s) => s.setRoomSize)
  const setRectFontSize = useStore((s) => s.setRectFontSize)
  const setPathThickness = useStore((s) => s.setPathThickness)
  const addRect = useStore((s) => s.addRect)
  const updateRect = useStore((s) => s.updateRect)
  const deleteRect = useStore((s) => s.deleteRect)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)
  const setState = useStore((s) => s.setState)

  // Lokaler State für Raum-Eingabefelder
  const [roomWidthInput, setRoomWidthInput] = useState(String(room.width))
  const [roomHeightInput, setRoomHeightInput] = useState(String(room.height))

  // Lokaler State für Darstellungs-Eingabefelder
  const [fontSizeInput, setFontSizeInput] = useState(String(rectFontSize))
  const [thicknessInput, setThicknessInput] = useState(String(pathThickness))

  // Synchronisiere lokalen State wenn sich room extern ändert (z.B. durch Drag-Handle)
  useEffect(() => {
    setRoomWidthInput(String(room.width))
  }, [room.width])

  useEffect(() => {
    setRoomHeightInput(String(room.height))
  }, [room.height])

  // Synchronisiere Darstellungs-Werte
  useEffect(() => {
    setFontSizeInput(String(rectFontSize))
  }, [rectFontSize])

  useEffect(() => {
    setThicknessInput(String(pathThickness))
  }, [pathThickness])

  const selectedRect = selectedRectId
    ? rects.find((r) => r.id === selectedRectId)
    : null

  // Debounced recompute
  const recomputeTimeoutRef = useRef<number | null>(null)
  
  const triggerRecompute = useCallback(() => {
    if (recomputeTimeoutRef.current) {
      clearTimeout(recomputeTimeoutRef.current)
    }
    recomputeTimeoutRef.current = window.setTimeout(() => {
      recomputeAllPaths(routePath)
    }, 100)
  }, [recomputeAllPaths])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (recomputeTimeoutRef.current) {
        clearTimeout(recomputeTimeoutRef.current)
      }
    }
  }, [])

  const applyRoomWidth = () => {
    const value = parseInt(roomWidthInput) || 200
    setRoomSize(value, room.height)
    triggerRecompute()
  }

  const applyRoomHeight = () => {
    const value = parseInt(roomHeightInput) || 200
    setRoomSize(room.width, value)
    triggerRecompute()
  }

  const applyFontSize = () => {
    const value = parseInt(fontSizeInput) || 12
    setRectFontSize(value)
  }

  const applyThickness = () => {
    const value = parseInt(thicknessInput) || 2
    setPathThickness(value)
  }

  const handleRectUpdate = (id: string, patch: Parameters<typeof updateRect>[1]) => {
    updateRect(id, patch)
    triggerRecompute()
  }

  const handleAddRect = () => {
    addRect({ width: 100, height: 60 })
    // Hole die ID des zuletzt erstellten Rechtecks und öffne den Bearbeitungsdialog
    const newRects = useStore.getState().rects
    const newRectId = newRects[newRects.length - 1]?.id
    if (newRectId) {
      setState({ 
        ui: { 
          mode: 'layout', 
          pendingStart: null, 
          selectedRectId: newRectId, 
          editingRectId: newRectId,
          selectedPathId: null 
        } 
      })
    }
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button */}
      <button 
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Mode Section */}
      <div className="sidebar-section">
        {!collapsed && <h3>Modus</h3>}
        <button
          className={`mode-btn ${mode === 'layout' ? 'active' : ''}`}
          onClick={() => setMode('layout')}
          title="Layout"
        >
          <span className="mode-icon">▢</span>
          {!collapsed && <span className="mode-text">Layout</span>}
        </button>
        <button
          className={`mode-btn ${mode === 'addPath' ? 'active' : ''}`}
          onClick={() => setMode('addPath')}
          title="Laufweg erstellen"
        >
          <span className="mode-icon">➔</span>
          {!collapsed && <span className="mode-text">Laufweg</span>}
        </button>
      </div>

      {/* Add Rectangle - always visible */}
      <div className="sidebar-section">
        {!collapsed && <h3>Rechtecke</h3>}
        <button 
          className="mode-btn" 
          onClick={handleAddRect}
          title="Neues Rechteck"
        >
          <span className="mode-icon">+</span>
          {!collapsed && <span className="mode-text">Neues Rechteck</span>}
        </button>
      </div>

      {/* Room Section - only when expanded */}
      {!collapsed && (
        <div className="sidebar-section">
          <h3>Raum</h3>
          <div className="sidebar-row">
            <span className="sidebar-label">Breite</span>
            <input
              type="number"
              className="sidebar-input"
              value={roomWidthInput}
              onChange={(e) => setRoomWidthInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyRoomWidth()}
              onBlur={applyRoomWidth}
              min={200}
              max={10000}
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Höhe</span>
            <input
              type="number"
              className="sidebar-input"
              value={roomHeightInput}
              onChange={(e) => setRoomHeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyRoomHeight()}
              onBlur={applyRoomHeight}
              min={200}
              max={5000}
            />
          </div>
        </div>
      )}

      {/* Room icon when collapsed */}
      {collapsed && (
        <div className="sidebar-section">
          <button
            className="mode-btn"
            title={`Raum: ${room.width} × ${room.height}`}
            style={{ cursor: 'default' }}
          >
            <span className="mode-icon">⬚</span>
          </button>
        </div>
      )}

      {/* Darstellung Section - only when expanded */}
      {!collapsed && (
        <div className="sidebar-section">
          <h3>Darstellung</h3>
          <div className="sidebar-row">
            <span className="sidebar-label">Schrift</span>
            <input
              type="number"
              className="sidebar-input"
              value={fontSizeInput}
              onChange={(e) => setFontSizeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyFontSize()
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // Bei Pfeiltasten: Nach kurzer Verzögerung anwenden (nach dem nativen Inkrement)
                  setTimeout(() => {
                    const input = e.target as HTMLInputElement
                    setRectFontSize(parseInt(input.value) || 12)
                  }, 0)
                }
              }}
              onBlur={applyFontSize}
              min={8}
              max={24}
              title="Schriftgröße der Rechteck-Beschriftungen"
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Pfeile</span>
            <input
              type="number"
              className="sidebar-input"
              value={thicknessInput}
              onChange={(e) => setThicknessInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyThickness()
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  // Bei Pfeiltasten: Nach kurzer Verzögerung anwenden (nach dem nativen Inkrement)
                  setTimeout(() => {
                    const input = e.target as HTMLInputElement
                    setPathThickness(parseInt(input.value) || 2)
                  }, 0)
                }
              }}
              onBlur={applyThickness}
              min={1}
              max={8}
              title="Stärke der Laufweg-Pfeile"
            />
          </div>
        </div>
      )}

      {/* Selected Rectangle - only when expanded */}
      {selectedRect && mode === 'layout' && !collapsed && (
        <div className="sidebar-section">
          <h3>Ausgewählt</h3>
          <div className="sidebar-row">
            <span className="sidebar-label">Name</span>
            <input
              type="text"
              className="sidebar-input"
              value={selectedRect.name}
              onChange={(e) =>
                updateRect(selectedRect.id, { name: e.target.value })
              }
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">X</span>
            <input
              type="number"
              className="sidebar-input"
              value={Math.round(selectedRect.x)}
              onChange={(e) =>
                handleRectUpdate(selectedRect.id, {
                  x: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Y</span>
            <input
              type="number"
              className="sidebar-input"
              value={Math.round(selectedRect.y)}
              onChange={(e) =>
                handleRectUpdate(selectedRect.id, {
                  y: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Breite</span>
            <input
              type="number"
              className="sidebar-input"
              value={selectedRect.width}
              onChange={(e) =>
                handleRectUpdate(selectedRect.id, {
                  width: parseInt(e.target.value) || 40,
                })
              }
              min={40}
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Höhe</span>
            <input
              type="number"
              className="sidebar-input"
              value={selectedRect.height}
              onChange={(e) =>
                handleRectUpdate(selectedRect.id, {
                  height: parseInt(e.target.value) || 40,
                })
              }
              min={40}
            />
          </div>
          <div className="sidebar-row">
            <span className="sidebar-label">Farbe</span>
            <input
              type="color"
              className="sidebar-color-input"
              value={selectedRect.color || '#d1d5db'}
              onChange={(e) =>
                updateRect(selectedRect.id, { color: e.target.value })
              }
            />
          </div>
          <button
            className="delete-btn"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={() => deleteRect(selectedRect.id)}
          >
            Rechteck löschen
          </button>
        </div>
      )}

      {/* Selected indicator when collapsed */}
      {selectedRect && mode === 'layout' && collapsed && (
        <div className="sidebar-section">
          <button
            className="mode-btn active"
            title={`Ausgewählt: ${selectedRect.name}`}
            style={{ cursor: 'default' }}
          >
            <span className="mode-icon">✓</span>
          </button>
        </div>
      )}
    </aside>
  )
}

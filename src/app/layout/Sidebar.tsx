import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../../state/store'
import { useUIMode, useRoom, useSelectedRectId, useRects } from '../../state/selectors'
import { routePath } from '../../lib/routing/router'

export function Sidebar() {
  const mode = useUIMode()
  const room = useRoom()
  const selectedRectId = useSelectedRectId()
  const rects = useRects()
  const setMode = useStore((s) => s.setMode)
  const setRoomSize = useStore((s) => s.setRoomSize)
  const addRect = useStore((s) => s.addRect)
  const updateRect = useStore((s) => s.updateRect)
  const deleteRect = useStore((s) => s.deleteRect)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)

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

  const handleRoomWidthChange = (value: number) => {
    setRoomSize(value || 200, room.height)
    triggerRecompute()
  }

  const handleRoomHeightChange = (value: number) => {
    setRoomSize(room.width, value || 200)
    triggerRecompute()
  }

  const handleRectUpdate = (id: string, patch: Parameters<typeof updateRect>[1]) => {
    updateRect(id, patch)
    triggerRecompute()
  }

  const handleAddRect = () => {
    addRect({ width: 100, height: 60 })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <h3>Modus</h3>
        <button
          className={`mode-btn ${mode === 'layout' ? 'active' : ''}`}
          onClick={() => setMode('layout')}
        >
          ▢ Layout
        </button>
        <button
          className={`mode-btn ${mode === 'addPath' ? 'active' : ''}`}
          onClick={() => setMode('addPath')}
        >
          ➔ Laufweg erstellen
        </button>
      </div>

      <div className="sidebar-section">
        <h3>Raum</h3>
        <div className="sidebar-row">
          <span className="sidebar-label">Breite</span>
          <input
            type="number"
            className="sidebar-input"
            value={room.width}
            onChange={(e) => handleRoomWidthChange(parseInt(e.target.value))}
            min={200}
          />
        </div>
        <div className="sidebar-row">
          <span className="sidebar-label">Höhe</span>
          <input
            type="number"
            className="sidebar-input"
            value={room.height}
            onChange={(e) => handleRoomHeightChange(parseInt(e.target.value))}
            min={200}
          />
        </div>
      </div>

      {mode === 'layout' && (
        <div className="sidebar-section">
          <h3>Rechtecke</h3>
          <button className="mode-btn" onClick={handleAddRect}>
            + Neues Rechteck
          </button>
        </div>
      )}

      {selectedRect && mode === 'layout' && (
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
          <button
            className="delete-btn"
            style={{ marginTop: '8px', width: '100%' }}
            onClick={() => deleteRect(selectedRect.id)}
          >
            Rechteck löschen
          </button>
        </div>
      )}
    </aside>
  )
}

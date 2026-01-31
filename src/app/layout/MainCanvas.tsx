import { useState, useCallback, useRef, useEffect } from 'react'
import { StageView } from '../../canvas/StageView'
import { PathsTable } from '../../table/PathsTable'
import { RectNameEditor } from '../../canvas/RectNameEditor'

// Berechne 30% der verfügbaren Höhe (Viewport - Topbar ~48px)
const getInitialTableHeight = () => Math.round((window.innerHeight - 48) * 0.3)

export function MainCanvas() {
  const [tableHeight, setTableHeight] = useState(getInitialTableHeight)
  const isDragging = useRef(false)
  const startY = useRef(0)
  const startHeight = useRef(0)

  // Bei Fenstergröße-Änderung die Proportionen anpassen (nur wenn nicht manuell geändert)
  const hasManuallyResized = useRef(false)
  
  useEffect(() => {
    if (hasManuallyResized.current) return
    
    const handleResize = () => {
      if (!hasManuallyResized.current) {
        setTableHeight(getInitialTableHeight())
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    hasManuallyResized.current = true  // Benutzer hat manuell geändert
    startY.current = e.clientY
    startHeight.current = tableHeight
    document.body.style.cursor = 'ns-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startY.current - e.clientY
      const newHeight = Math.min(600, Math.max(100, startHeight.current + delta))
      setTableHeight(newHeight)
    }

    const handleMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [tableHeight])

  return (
    <main className="main-area">
      <div className="canvas-container">
        <StageView />
        <RectNameEditor />
      </div>
      <div className="resizer-handle" onMouseDown={handleMouseDown}>
        <div className="resizer-line" />
      </div>
      <div style={{ height: tableHeight, minHeight: 100, maxHeight: 600 }}>
        <PathsTable />
      </div>
    </main>
  )
}


import { Line, Arrow, Rect } from 'react-konva'
import { usePaths, useRects, useUIMode, useSelectedPathId, usePathThickness } from '../state/selectors'
import { useStore } from '../state/store'
import { calculateSegmentThicknesses } from '../lib/routing/overlap'
import { useMemo, useState } from 'react'

const ARROW_POINTER_LENGTH = 12
const ARROW_POINTER_WIDTH = 10
const BASE_COLOR = '#5fb3b3'
const HOVER_COLOR = '#4a9c9c'
const DRAG_HANDLE_SIZE = 8

type SegmentData = {
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
  isHorizontal: boolean
  segmentIndex: number
}

export function PathLayer() {
  const paths = usePaths()
  const mode = useUIMode()
  const selectedPathId = useSelectedPathId()
  const pathThickness = usePathThickness()
  const setState = useStore((s) => s.setState)

  // Collect all path points for overlap calculation
  const allPathsPoints = useMemo(() => paths.map((p) => p.points), [paths])

  const handlePathClick = (pathId: string) => {
    if (mode === 'addPath') {
      // Im Laufweg-Modus: Pfad auswählen/abwählen
      const newSelectedId = selectedPathId === pathId ? null : pathId
      setState({ ui: { mode: 'addPath', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: newSelectedId } })
    }
  }

  return (
    <>
      {paths.map((path) => {
        if (path.points.length < 4) return null

        // Calculate thickness for each segment
        const segmentsWithThickness = calculateSegmentThicknesses(
          path.points,
          allPathsPoints,
          pathThickness
        )

        // Get the last segment for arrow direction
        const lastSegment = segmentsWithThickness[segmentsWithThickness.length - 1]
        const lastThickness = lastSegment?.thickness || 2

        const isSelected = selectedPathId === path.id

        return (
          <DraggablePath
            key={path.id}
            pathId={path.id}
            points={path.points}
            segmentsWithThickness={segmentsWithThickness}
            lastThickness={lastThickness}
            isPathMode={mode === 'addPath'}
            isSelected={isSelected}
            onPathClick={() => handlePathClick(path.id)}
          />
        )
      })}
    </>
  )
}

// Prüft ob zwei Segmente kollinear sind (gleiche Achse und gleiche Position auf dieser Achse)
function areSegmentsCollinear(seg1: SegmentData, seg2: SegmentData): boolean {
  // Beide müssen die gleiche Orientierung haben
  if (seg1.isHorizontal !== seg2.isHorizontal) return false
  
  if (seg1.isHorizontal) {
    // Beide horizontal - prüfe ob gleicher Y-Wert
    return Math.abs(seg1.y1 - seg2.y1) < 1
  } else {
    // Beide vertikal - prüfe ob gleicher X-Wert
    return Math.abs(seg1.x1 - seg2.x1) < 1
  }
}

function DraggablePath({
  pathId,
  points,
  segmentsWithThickness,
  lastThickness,
  isPathMode,
  isSelected,
  onPathClick,
}: {
  pathId: string
  points: number[]
  segmentsWithThickness: SegmentData[]
  lastThickness: number
  isPathMode: boolean
  isSelected: boolean
  onPathClick: () => void
}) {
  const updatePathPoints = useStore((s) => s.updatePathPoints)
  const rects = useRects()
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [draggingSegment, setDraggingSegment] = useState<number | null>(null)

  if (segmentsWithThickness.length === 0) return null

  const lastIdx = segmentsWithThickness.length - 1
  const firstSegment = segmentsWithThickness[0]
  const lastSegment = segmentsWithThickness[lastIdx]

  // Prüft ob ein Segment editierbar ist (nicht kollinear mit erstem oder letztem Segment)
  const isSegmentEditable = (seg: SegmentData, idx: number): boolean => {
    // Erstes und letztes Segment sind nie editierbar
    if (idx === 0 || idx === lastIdx) return false
    
    // Prüfe Kollinearität mit erstem Segment
    if (areSegmentsCollinear(seg, firstSegment)) return false
    
    // Prüfe Kollinearität mit letztem Segment
    if (areSegmentsCollinear(seg, lastSegment)) return false
    
    return true
  }

  // Prüft ob ein Segment mit einem Rechteck kollidiert
  const segmentCollidesWithRect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): boolean => {
    const margin = 2
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)

    return rects.some((rect) => {
      const rectLeft = rect.x - margin
      const rectRight = rect.x + rect.width + margin
      const rectTop = rect.y - margin
      const rectBottom = rect.y + rect.height + margin

      // Prüfe ob Segment-Bounding-Box mit Rect-Bounding-Box überlappt
      return !(maxX < rectLeft || minX > rectRight || maxY < rectTop || minY > rectBottom)
    })
  }

  // Berechne die Drag-Handle-Position für ein Segment
  const getSegmentHandlePosition = (seg: SegmentData) => {
    const midX = (seg.x1 + seg.x2) / 2
    const midY = (seg.y1 + seg.y2) / 2
    return { x: midX, y: midY }
  }

  return (
    <>
      {/* Render alle Segmente außer dem letzten als Lines */}
      {segmentsWithThickness.slice(0, -1).map((seg, idx) => {
        const isHovered = hoveredSegment === idx
        const isDragging = draggingSegment === idx
        // Segment ist draggable wenn: im Laufweg-Modus, ausgewählt und editierbar
        const canDrag = isPathMode && isSelected && isSegmentEditable(seg, idx)
        
        return (
          <Line
            key={`seg-${idx}`}
            points={[seg.x1, seg.y1, seg.x2, seg.y2]}
            stroke={isSelected ? HOVER_COLOR : (isHovered || isDragging ? HOVER_COLOR : BASE_COLOR)}
            strokeWidth={seg.thickness + (isHovered || isSelected ? 2 : 0)}
            lineCap="round"
            lineJoin="round"
            shadowColor="rgba(95, 179, 179, 0.4)"
            shadowBlur={4}
            shadowOpacity={0.5}
            onClick={onPathClick}
            onTap={onPathClick}
            onMouseEnter={(e) => {
              if (isPathMode) {
                const container = e.target.getStage()?.container()
                if (container) {
                  container.style.cursor = canDrag ? (seg.isHorizontal ? 'ns-resize' : 'ew-resize') : 'pointer'
                }
              }
              if (canDrag) {
                setHoveredSegment(idx)
              }
            }}
            onMouseLeave={(e) => {
              setHoveredSegment(null)
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        )
      })}

      {/* Render das letzte Segment als Arrow */}
      {segmentsWithThickness.length > 0 && (
        <Arrow
          points={[
            segmentsWithThickness[lastIdx].x1,
            segmentsWithThickness[lastIdx].y1,
            segmentsWithThickness[lastIdx].x2,
            segmentsWithThickness[lastIdx].y2,
          ]}
          stroke={isSelected ? HOVER_COLOR : BASE_COLOR}
          strokeWidth={lastThickness + (isSelected ? 2 : 0)}
          fill={isSelected ? HOVER_COLOR : BASE_COLOR}
          pointerLength={ARROW_POINTER_LENGTH}
          pointerWidth={ARROW_POINTER_WIDTH}
          lineCap="round"
          lineJoin="round"
          shadowColor="rgba(214, 180, 140, 0.4)"
          shadowBlur={4}
          shadowOpacity={0.5}
          onClick={onPathClick}
          onTap={onPathClick}
          onMouseEnter={(e) => {
            if (isPathMode) {
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'pointer'
            }
          }}
          onMouseLeave={(e) => {
            const container = e.target.getStage()?.container()
            if (container) container.style.cursor = 'default'
          }}
        />
      )}

      {/* Ecken-Kreise für glatte Übergänge */}
      {segmentsWithThickness.slice(0, -1).map((seg, idx) => {
        const nextSeg = segmentsWithThickness[idx + 1]
        if (!nextSeg) return null
        
        const maxThickness = Math.max(seg.thickness, nextSeg.thickness)
        
        return (
          <Line
            key={`corner-${idx}`}
            points={[seg.x2, seg.y2]}
            stroke={BASE_COLOR}
            strokeWidth={maxThickness}
            lineCap="round"
          />
        )
      })}

      {/* Draggable Handles für editierbare Segmente (nur wenn Pfad ausgewählt) */}
      {isPathMode && isSelected && segmentsWithThickness.map((seg, idx) => {
        // Nur editierbare Segmente bekommen Handles
        if (!isSegmentEditable(seg, idx)) return null
        
        const handlePos = getSegmentHandlePosition(seg)
        const isHovered = hoveredSegment === idx
        const isDragging = draggingSegment === idx
        
        return (
          <Rect
            key={`handle-${idx}`}
            x={handlePos.x - DRAG_HANDLE_SIZE / 2}
            y={handlePos.y - DRAG_HANDLE_SIZE / 2}
            width={DRAG_HANDLE_SIZE}
            height={DRAG_HANDLE_SIZE}
            fill={isDragging ? '#3d9494' : isHovered ? '#4a9c9c' : '#5fb3b3'}
            stroke="#ffffff"
            strokeWidth={1}
            cornerRadius={2}
            opacity={isHovered || isDragging ? 1 : 0.7}
            draggable
            dragBoundFunc={(pos) => {
              // Beschränke Drag-Richtung strikt auf eine Achse
              if (seg.isHorizontal) {
                // Horizontales Segment: nur vertikal bewegen
                return { x: handlePos.x - DRAG_HANDLE_SIZE / 2, y: pos.y }
              } else {
                // Vertikales Segment: nur horizontal bewegen
                return { x: pos.x, y: handlePos.y - DRAG_HANDLE_SIZE / 2 }
              }
            }}
            onDragStart={() => setDraggingSegment(idx)}
            onDragMove={(e) => {
              const node = e.target
              const newPoints = [...points]
              const startPointIndex = idx * 2
              
              if (seg.isHorizontal) {
                // Horizontales Segment: nur Y ändern
                const newY = Math.round(node.y() + DRAG_HANDLE_SIZE / 2)
                
                // Kollisionsprüfung
                if (segmentCollidesWithRect(seg.x1, newY, seg.x2, newY)) {
                  return
                }
                
                // Update nur Y-Koordinaten des aktuellen Segments
                newPoints[startPointIndex + 1] = newY // Start Y
                newPoints[startPointIndex + 3] = newY // End Y
                
                // Vorheriges Segment Ende (Y anpassen)
                if (idx > 0) {
                  newPoints[startPointIndex - 1] = newY
                }
                // Nächstes Segment Anfang (Y anpassen)
                if (idx < segmentsWithThickness.length - 1 && startPointIndex + 5 < newPoints.length) {
                  newPoints[startPointIndex + 3] = newY
                }
              } else {
                // Vertikales Segment: nur X ändern
                const newX = Math.round(node.x() + DRAG_HANDLE_SIZE / 2)
                
                if (segmentCollidesWithRect(newX, seg.y1, newX, seg.y2)) {
                  return
                }
                
                // Update nur X-Koordinaten des aktuellen Segments
                newPoints[startPointIndex] = newX // Start X
                newPoints[startPointIndex + 2] = newX // End X
                
                // Vorheriges Segment Ende (X anpassen)
                if (idx > 0) {
                  newPoints[startPointIndex - 2] = newX
                }
                // Nächstes Segment Anfang (X anpassen)
                if (idx < segmentsWithThickness.length - 1 && startPointIndex + 4 < newPoints.length) {
                  newPoints[startPointIndex + 2] = newX
                }
              }
              
              updatePathPoints(pathId, newPoints)
            }}
            onDragEnd={() => setDraggingSegment(null)}
            onMouseEnter={(e) => {
              setHoveredSegment(idx)
              const container = e.target.getStage()?.container()
              if (container) {
                container.style.cursor = seg.isHorizontal ? 'ns-resize' : 'ew-resize'
              }
            }}
            onMouseLeave={(e) => {
              if (draggingSegment !== idx) {
                setHoveredSegment(null)
              }
              const container = e.target.getStage()?.container()
              if (container) container.style.cursor = 'default'
            }}
          />
        )
      })}
    </>
  )
}

import { Line, Arrow, Rect } from 'react-konva'
import { usePaths, useRects, useUIMode, useSelectedPathId, usePathThickness, useHoveredPathId, usePathOrder, useOverlapSpacing } from '../state/selectors'
import { useStore } from '../state/store'
import { calculateSegmentOffsets, type SegmentWithOffset } from '../lib/routing/overlap'
import { useMemo, useState } from 'react'

const ARROW_POINTER_LENGTH = 12
const ARROW_POINTER_WIDTH = 10
const BASE_COLOR = '#5fb3b3'
const HOVER_COLOR = '#4a9c9c'
const DRAG_HANDLE_SIZE = 8

export function PathLayer() {
  const paths = usePaths()
  const pathOrder = usePathOrder()
  const mode = useUIMode()
  const selectedPathId = useSelectedPathId()
  const hoveredPathId = useHoveredPathId()
  const pathThickness = usePathThickness()
  const overlapSpacing = useOverlapSpacing()
  const setState = useStore((s) => s.setState)

  const allPaths = useMemo(
    () => paths.filter((p) => !p.isPlaceholder && p.points.length >= 4).map((p) => ({ id: p.id, points: p.points })),
    [paths]
  )

  const handlePathClick = (pathId: string) => {
    if (mode === 'addPath') {
      const newSelectedId = selectedPathId === pathId ? null : pathId
      setState({ ui: { mode: 'addPath', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: newSelectedId, hoveredPathId: null } })
    }
  }

  return (
    <>
      {paths.map((path) => {
        if (path.isPlaceholder || path.points.length < 4) return null

        const segmentsWithOffset = calculateSegmentOffsets(
          path.id,
          path.points,
          allPaths,
          pathOrder,
          overlapSpacing
        )

        const isSelected = selectedPathId === path.id
        const isHovered = hoveredPathId === path.id

        return (
          <DraggablePath
            key={path.id}
            pathId={path.id}
            points={path.points}
            segmentsWithOffset={segmentsWithOffset}
            pathThickness={pathThickness}
            isPathMode={mode === 'addPath'}
            isSelected={isSelected}
            isHovered={isHovered}
            onPathClick={() => handlePathClick(path.id)}
          />
        )
      })}
    </>
  )
}

function areSegmentsCollinear(seg1: SegmentWithOffset, seg2: SegmentWithOffset): boolean {
  if (seg1.isHorizontal !== seg2.isHorizontal) return false
  if (seg1.isHorizontal) {
    return Math.abs(seg1.y1 - seg2.y1) < 1
  }
  return Math.abs(seg1.x1 - seg2.x1) < 1
}

function applyOffsetToSegment(seg: SegmentWithOffset): [number, number, number, number] {
  const o = seg.offset
  if (seg.isHorizontal) {
    return [seg.x1, seg.y1 + o, seg.x2, seg.y2 + o]
  }
  return [seg.x1 + o, seg.y1, seg.x2 + o, seg.y2]
}

function DraggablePath({
  pathId,
  points,
  segmentsWithOffset,
  pathThickness,
  isPathMode,
  isSelected,
  isHovered,
  onPathClick,
}: {
  pathId: string
  points: number[]
  segmentsWithOffset: SegmentWithOffset[]
  pathThickness: number
  isPathMode: boolean
  isSelected: boolean
  isHovered: boolean
  onPathClick: () => void
}) {
  const updatePathPoints = useStore((s) => s.updatePathPoints)
  const rects = useRects()
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [draggingSegment, setDraggingSegment] = useState<number | null>(null)

  if (segmentsWithOffset.length === 0) return null

  const lastIdx = segmentsWithOffset.length - 1
  const firstSegment = segmentsWithOffset[0]
  const lastSegment = segmentsWithOffset[lastIdx]

  const isSegmentEditable = (seg: SegmentWithOffset, idx: number): boolean => {
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

  const getSegmentHandlePosition = (seg: SegmentWithOffset) => {
    const midX = (seg.x1 + seg.x2) / 2
    const midY = (seg.y1 + seg.y2) / 2
    return { x: midX, y: midY }
  }

  const strokeWidth = pathThickness + (isSelected || isHovered ? 2 : 0)
  const strokeColor = (isSelected || isHovered) ? HOVER_COLOR : BASE_COLOR

  return (
    <>
      {/* Render alle Segmente außer dem letzten als Lines (mit Offset) */}
      {segmentsWithOffset.slice(0, -1).map((seg, idx) => {
        const isSegmentHovered = hoveredSegment === idx
        const isDragging = draggingSegment === idx
        const canDrag = isPathMode && isSelected && isSegmentEditable(seg, idx)
        const segColor = isSegmentHovered || isDragging ? HOVER_COLOR : strokeColor
        const segStrokeWidth = pathThickness + (isSegmentHovered || isSelected || isHovered ? 2 : 0)

        return (
          <Line
            key={`seg-${idx}`}
            points={applyOffsetToSegment(seg)}
            stroke={segColor}
            strokeWidth={segStrokeWidth}
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

      {/* Diagonale Ecken-Segmente zwischen versetzten Segmenten */}
      {segmentsWithOffset.slice(0, -1).map((seg, idx) => {
        const nextSeg = segmentsWithOffset[idx + 1]
        if (!nextSeg) return null
        const o1 = seg.offset
        const o2 = nextSeg.offset
        const { x2, y2 } = seg
        const end1 = seg.isHorizontal ? [x2, y2 + o1] : [x2 + o1, y2]
        const start2 = nextSeg.isHorizontal ? [x2, y2 + o2] : [x2 + o2, y2]
        if (end1[0] === start2[0] && end1[1] === start2[1]) return null
        return (
          <Line
            key={`corner-${idx}`}
            points={[...end1, ...start2]}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            lineCap="round"
            lineJoin="round"
            onClick={onPathClick}
            onTap={onPathClick}
          />
        )
      })}

      {/* Letztes Segment als Arrow (mit Offset) */}
      {segmentsWithOffset.length > 0 && (
        <Arrow
          points={applyOffsetToSegment(segmentsWithOffset[lastIdx])}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={strokeColor}
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

      {/* Draggable Handles für editierbare Segmente (nur wenn Pfad ausgewählt) */}
      {isPathMode && isSelected && segmentsWithOffset.map((seg, idx) => {
        // Nur editierbare Segmente bekommen Handles
        if (!isSegmentEditable(seg, idx)) return null
        
        const handlePos = getSegmentHandlePosition(seg)
        const isSegmentHovered = hoveredSegment === idx
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
            opacity={isSegmentHovered || isDragging ? 1 : 0.7}
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
                if (idx < segmentsWithOffset.length - 1 && startPointIndex + 5 < newPoints.length) {
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
                if (idx < segmentsWithOffset.length - 1 && startPointIndex + 4 < newPoints.length) {
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

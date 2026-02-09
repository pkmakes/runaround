import { Rect, Circle } from 'react-konva'
import { useRoom, useUIMode } from '../state/selectors'
import { useStore } from '../state/store'
import { useState, useCallback } from 'react'
import { routePath } from '../lib/routing/router'

const HANDLE_SIZE = 16
const MAX_ROOM_WIDTH = 10000
const MAX_ROOM_HEIGHT = 5000

export function RoomLayer() {
  const room = useRoom()
  const mode = useUIMode()
  const resizeRoomByHandle = useStore((s) => s.resizeRoomByHandle)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)
  const setState = useStore((s) => s.setState)
  const [isResizing, setIsResizing] = useState(false)

  const triggerRecompute = useCallback(() => {
    recomputeAllPaths(routePath)
  }, [recomputeAllPaths])

  const handleRoomClick = () => {
    // Im Layout- und Laufweg-Modus: Alles deselektieren bei Klick auf leere Fläche
    if (mode === 'layout') {
      setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: null, hoveredPathId: null } })
    } else if (mode === 'addPath') {
      setState({ ui: { mode: 'addPath', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: null, hoveredPathId: null } })
    }
  }

  return (
    <>
      {/* Room background */}
      <Rect
        x={0}
        y={0}
        width={room.width}
        height={room.height}
        fill="#ffffff"
        stroke="#cbd5e1"
        strokeWidth={2}
        onClick={handleRoomClick}
        onTap={handleRoomClick}
      />

      {/* Dotted grid pattern */}
      {(() => {
        const dots = []
        const spacing = 50
        for (let x = 0; x <= room.width; x += spacing) {
          for (let y = 0; y <= room.height; y += spacing) {
            dots.push(
              <Circle
                key={`dot-${x}-${y}`}
                x={x}
                y={y}
                radius={2.5}
                fill="#d1d5db"
                listening={false}
              />
            )
          }
        }
        return dots
      })()}

      {/* Resize handle */}
      <Rect
        x={room.width - HANDLE_SIZE}
        y={room.height - HANDLE_SIZE}
        width={HANDLE_SIZE}
        height={HANDLE_SIZE}
        fill={isResizing ? '#10b981' : '#3b82f6'}
        stroke="#ffffff"
        strokeWidth={1}
        cornerRadius={2}
        draggable
        onDragStart={() => setIsResizing(true)}
        onDragMove={(e) => {
          const node = e.target
          const newWidth = Math.min(MAX_ROOM_WIDTH, Math.max(200, Math.round(node.x() + HANDLE_SIZE)))
          const newHeight = Math.min(MAX_ROOM_HEIGHT, Math.max(200, Math.round(node.y() + HANDLE_SIZE)))
          resizeRoomByHandle(newWidth, newHeight)
          // Reset position relative to new room size
          node.x(newWidth - HANDLE_SIZE)
          node.y(newHeight - HANDLE_SIZE)
        }}
        onDragEnd={() => {
          setIsResizing(false)
          // Recompute all paths after room resize
          setTimeout(triggerRecompute, 0)
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container()
          if (container) container.style.cursor = 'nwse-resize'
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container()
          if (container) container.style.cursor = 'default'
        }}
      />
    </>
  )
}
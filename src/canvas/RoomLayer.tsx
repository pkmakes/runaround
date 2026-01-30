import { Rect } from 'react-konva'
import { useRoom } from '../state/selectors'
import { useStore } from '../state/store'
import { useState, useCallback } from 'react'
import { routePath } from '../lib/routing/router'

const HANDLE_SIZE = 16

export function RoomLayer() {
  const room = useRoom()
  const resizeRoomByHandle = useStore((s) => s.resizeRoomByHandle)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)
  const [isResizing, setIsResizing] = useState(false)

  const triggerRecompute = useCallback(() => {
    recomputeAllPaths(routePath)
  }, [recomputeAllPaths])

  return (
    <>
      {/* Room background */}
      <Rect
        x={0}
        y={0}
        width={room.width}
        height={room.height}
        fill="#1e2a3a"
        stroke="#3a5a8a"
        strokeWidth={2}
      />

      {/* Grid pattern */}
      {Array.from({ length: Math.floor(room.width / 50) + 1 }).map((_, i) => (
        <Rect
          key={`vline-${i}`}
          x={i * 50}
          y={0}
          width={1}
          height={room.height}
          fill="rgba(255,255,255,0.05)"
        />
      ))}
      {Array.from({ length: Math.floor(room.height / 50) + 1 }).map((_, i) => (
        <Rect
          key={`hline-${i}`}
          x={0}
          y={i * 50}
          width={room.width}
          height={1}
          fill="rgba(255,255,255,0.05)"
        />
      ))}

      {/* Resize handle */}
      <Rect
        x={room.width - HANDLE_SIZE}
        y={room.height - HANDLE_SIZE}
        width={HANDLE_SIZE}
        height={HANDLE_SIZE}
        fill={isResizing ? '#00ff88' : '#4a7ab8'}
        stroke="#ffffff"
        strokeWidth={1}
        cornerRadius={2}
        draggable
        onDragStart={() => setIsResizing(true)}
        onDragMove={(e) => {
          const node = e.target
          const newWidth = node.x() + HANDLE_SIZE
          const newHeight = node.y() + HANDLE_SIZE
          resizeRoomByHandle(
            Math.max(200, Math.round(newWidth)),
            Math.max(200, Math.round(newHeight))
          )
          // Reset position relative to new room size
          node.x(Math.max(200, Math.round(newWidth)) - HANDLE_SIZE)
          node.y(Math.max(200, Math.round(newHeight)) - HANDLE_SIZE)
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

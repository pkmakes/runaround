import { Rect, Text, Group } from 'react-konva'
import { useRects, useRoom, useSelectedRectId, useUIMode } from '../state/selectors'
import { useStore } from '../state/store'
import { useState, useCallback } from 'react'
import { routePath } from '../lib/routing/router'

const HANDLE_SIZE = 10
const MIN_SIZE = 40

export function RectLayer() {
  const rects = useRects()
  const room = useRoom()
  const selectedRectId = useSelectedRectId()
  const mode = useUIMode()
  const updateRect = useStore((s) => s.updateRect)
  const setState = useStore((s) => s.setState)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)

  const [resizingId, setResizingId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    if (mode === 'layout') {
      setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: id } })
    }
  }

  const triggerRecompute = useCallback(() => {
    recomputeAllPaths(routePath)
  }, [recomputeAllPaths])

  return (
    <>
      {rects.map((rect) => {
        const isSelected = selectedRectId === rect.id
        const isResizing = resizingId === rect.id

        return (
          <Group key={rect.id}>
            {/* Rectangle */}
            <Rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={isSelected ? '#1d4ed8' : '#3b82f6'}
              stroke={isSelected ? '#10b981' : '#60a5fa'}
              strokeWidth={isSelected ? 3 : 2}
              cornerRadius={4}
              shadowColor="black"
              shadowBlur={isSelected ? 10 : 5}
              shadowOpacity={0.3}
              draggable={mode === 'layout'}
              onClick={() => handleSelect(rect.id)}
              onTap={() => handleSelect(rect.id)}
              onDragMove={(e) => {
                const node = e.target
                let x = node.x()
                let y = node.y()

                // Clamp within room
                x = Math.max(0, Math.min(room.width - rect.width, x))
                y = Math.max(0, Math.min(room.height - rect.height, y))

                node.x(x)
                node.y(y)
              }}
              onDragEnd={(e) => {
                const node = e.target
                updateRect(rect.id, {
                  x: Math.round(node.x()),
                  y: Math.round(node.y()),
                })
                // Recompute all paths after rect move
                setTimeout(triggerRecompute, 0)
              }}
              onMouseEnter={(e) => {
                if (mode === 'layout') {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'move'
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'default'
              }}
            />

            {/* Name label */}
            <Text
              x={rect.x + 5}
              y={rect.y + 5}
              width={rect.width - 10}
              text={rect.name}
              fontSize={12}
              fontFamily="Inter, system-ui, sans-serif"
              fill="#ffffff"
              listening={false}
            />

            {/* Resize handle */}
            {isSelected && (
              <Rect
                x={rect.x + rect.width - HANDLE_SIZE}
                y={rect.y + rect.height - HANDLE_SIZE}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill={isResizing ? '#ef4444' : '#10b981'}
                stroke="#ffffff"
                strokeWidth={1}
                cornerRadius={2}
                draggable
                onDragStart={() => setResizingId(rect.id)}
                onDragMove={(e) => {
                  const node = e.target
                  const handleX = node.x()
                  const handleY = node.y()

                  let newWidth = handleX - rect.x + HANDLE_SIZE
                  let newHeight = handleY - rect.y + HANDLE_SIZE

                  // Minimum size
                  newWidth = Math.max(MIN_SIZE, newWidth)
                  newHeight = Math.max(MIN_SIZE, newHeight)

                  // Clamp to room bounds
                  newWidth = Math.min(newWidth, room.width - rect.x)
                  newHeight = Math.min(newHeight, room.height - rect.y)

                  // Update immediately for visual feedback
                  updateRect(rect.id, {
                    width: Math.round(newWidth),
                    height: Math.round(newHeight),
                  })

                  // Keep handle at corner
                  node.x(rect.x + Math.round(newWidth) - HANDLE_SIZE)
                  node.y(rect.y + Math.round(newHeight) - HANDLE_SIZE)
                }}
                onDragEnd={() => {
                  setResizingId(null)
                  // Recompute all paths after rect resize
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
            )}
          </Group>
        )
      })}
    </>
  )
}

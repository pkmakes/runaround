import { Circle } from 'react-konva'
import { useRects, useUIMode, usePendingStart } from '../state/selectors'
import { useStore } from '../state/store'
import type { DockSide, RectNode } from '../state/store'
import { routePath } from '../lib/routing/router'

const DOCK_RADIUS = 6
const DOCK_RADIUS_HOVER = 8

export function getDockSidePoints(rect: RectNode): { side: DockSide; x: number; y: number }[] {
  return [
    { side: 'top', x: rect.x + rect.width / 2, y: rect.y },
    { side: 'right', x: rect.x + rect.width, y: rect.y + rect.height / 2 },
    { side: 'bottom', x: rect.x + rect.width / 2, y: rect.y + rect.height },
    { side: 'left', x: rect.x, y: rect.y + rect.height / 2 },
  ]
}

export function Dockpoints() {
  const rects = useRects()
  const mode = useUIMode()
  const pendingStart = usePendingStart()
  const setPendingStart = useStore((s) => s.setPendingStart)
  const addPath = useStore((s) => s.addPath)
  const room = useStore((s) => s.room)

  if (mode !== 'addPath') return null

  const handleDockClick = (rectId: string, side: DockSide) => {
    if (!pendingStart) {
      setPendingStart({ rectId, side })
    } else {
      // Create path
      const from = pendingStart
      const to = { rectId, side }
      
      // Route the path (always orthogonal, never diagonal)
      const points = routePath(from, to, rects, room)
      
      // No more overlap offset - thickness will be increased for overlapping segments
      addPath(from, to, points)
      setPendingStart(null)
    }
  }

  return (
    <>
      {rects.flatMap((rect) =>
        getDockSidePoints(rect).map(({ side, x, y }) => {
          const isPending =
            pendingStart?.rectId === rect.id && pendingStart?.side === side

          return (
            <Circle
              key={`${rect.id}-${side}`}
              x={x}
              y={y}
              radius={isPending ? DOCK_RADIUS_HOVER : DOCK_RADIUS}
              fill={isPending ? '#00ff88' : '#ffd700'}
              stroke="#ffffff"
              strokeWidth={2}
              shadowColor="rgba(255, 215, 0, 0.6)"
              shadowBlur={isPending ? 12 : 6}
              shadowOpacity={1}
              onClick={() => handleDockClick(rect.id, side)}
              onTap={() => handleDockClick(rect.id, side)}
              onMouseEnter={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'pointer'
                const target = e.target as unknown as { radius: (r: number) => void }
                target.radius(DOCK_RADIUS_HOVER)
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'default'
                if (!isPending) {
                  const target = e.target as unknown as { radius: (r: number) => void }
                  target.radius(DOCK_RADIUS)
                }
              }}
            />
          )
        })
      )}
    </>
  )
}

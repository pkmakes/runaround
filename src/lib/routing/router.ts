import type { DockSide, RectNode, Room } from '../../state/store'
import { getDockPoint, getExitDirection } from '../geometry'
import { buildObstacleGrid, worldToGrid, gridToWorld, DEFAULT_CELL_SIZE } from './grid'
import { astar } from './astar'

const STUB_CELLS = 2
const DEFAULT_MARGIN = 6

export function routePath(
  from: { rectId: string; side: DockSide },
  to: { rectId: string; side: DockSide },
  rects: RectNode[],
  room: Room,
  cellSize: number = DEFAULT_CELL_SIZE,
  margin: number = DEFAULT_MARGIN
): number[] {
  const fromRect = rects.find((r) => r.id === from.rectId)
  const toRect = rects.find((r) => r.id === to.rectId)

  if (!fromRect || !toRect) {
    return []
  }

  const dockStart = getDockPoint(fromRect, from.side)
  const dockEnd = getDockPoint(toRect, to.side)

  const exitDirStart = getExitDirection(from.side)
  const exitDirEnd = getExitDirection(to.side)

  // Create stubs
  const stubStart = {
    x: dockStart.x + exitDirStart.dx * cellSize * STUB_CELLS,
    y: dockStart.y + exitDirStart.dy * cellSize * STUB_CELLS,
  }

  const stubEnd = {
    x: dockEnd.x + exitDirEnd.dx * cellSize * STUB_CELLS,
    y: dockEnd.y + exitDirEnd.dy * cellSize * STUB_CELLS,
  }

  // Try routing with different parameters
  const attempts: { cellSize: number; margin: number }[] = [
    { cellSize, margin },
    { cellSize: 5, margin: 4 },
    { cellSize: 5, margin: 2 },
    { cellSize: 3, margin: 2 },
  ]

  for (const attempt of attempts) {
    const result = tryRoute(
      dockStart,
      stubStart,
      stubEnd,
      dockEnd,
      rects,
      room,
      from.rectId,
      to.rectId,
      attempt.cellSize,
      attempt.margin
    )
    if (result) {
      return result
    }
  }

  // Fallback: straight line (will probably cross rects)
  return [dockStart.x, dockStart.y, dockEnd.x, dockEnd.y]
}

function tryRoute(
  dockStart: { x: number; y: number },
  stubStart: { x: number; y: number },
  stubEnd: { x: number; y: number },
  dockEnd: { x: number; y: number },
  rects: RectNode[],
  room: Room,
  fromRectId: string,
  toRectId: string,
  cellSize: number,
  margin: number
): number[] | null {
  // Build grid excluding start and end rects from blocking
  const blockedRects = rects.filter((r) => r.id !== fromRectId && r.id !== toRectId)
  const blocked = buildObstacleGrid(room, blockedRects, margin, cellSize)

  const startGrid = worldToGrid(stubStart.x, stubStart.y, cellSize)
  const endGrid = worldToGrid(stubEnd.x, stubEnd.y, cellSize)

  const gridWidth = Math.ceil(room.width / cellSize)
  const gridHeight = Math.ceil(room.height / cellSize)

  const gridPath = astar(
    startGrid.gx,
    startGrid.gy,
    endGrid.gx,
    endGrid.gy,
    blocked,
    gridWidth,
    gridHeight
  )

  if (!gridPath) {
    return null
  }

  // Convert grid path to world coordinates
  const worldPath = gridPath.map((node) => gridToWorld(node.gx, node.gy, cellSize))

  // Build full path: dock -> stub -> routed path -> stub -> dock
  const fullPath: { x: number; y: number }[] = [
    dockStart,
    stubStart,
    ...worldPath,
    stubEnd,
    dockEnd,
  ]

  // Simplify: remove collinear intermediate points
  const simplified = simplifyPath(fullPath)

  // Convert to flat array
  const points: number[] = []
  for (const p of simplified) {
    points.push(p.x, p.y)
  }

  return points
}

function simplifyPath(path: { x: number; y: number }[]): { x: number; y: number }[] {
  if (path.length <= 2) return path

  const result: { x: number; y: number }[] = [path[0]]

  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1]
    const curr = path[i]
    const next = path[i + 1]

    // Check if collinear
    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y

    // Normalize directions
    const dir1 = dx1 !== 0 ? 'h' : dy1 !== 0 ? 'v' : 'none'
    const dir2 = dx2 !== 0 ? 'h' : dy2 !== 0 ? 'v' : 'none'

    // If direction changes, keep this point
    if (dir1 !== dir2 || dir1 === 'none') {
      result.push(curr)
    }
  }

  result.push(path[path.length - 1])

  return result
}


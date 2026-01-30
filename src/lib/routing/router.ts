import type { DockSide, RectNode, Room } from '../../state/store'
import { getDockPoint, getExitDirection } from '../geometry'
import { buildObstacleGrid, worldToGrid, gridToWorld, DEFAULT_CELL_SIZE } from './grid'
import { astar } from './astar'

const STUB_CELLS = 3
const DEFAULT_MARGIN = 8

export function routePath(
  from: { rectId: string; side: DockSide },
  to: { rectId: string; side: DockSide },
  rects: RectNode[],
  room: Room,
  cellSize: number = DEFAULT_CELL_SIZE,
  _margin: number = DEFAULT_MARGIN
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

  // Create stubs - points outside the rectangles
  const stubStart = {
    x: dockStart.x + exitDirStart.dx * cellSize * STUB_CELLS,
    y: dockStart.y + exitDirStart.dy * cellSize * STUB_CELLS,
  }

  const stubEnd = {
    x: dockEnd.x + exitDirEnd.dx * cellSize * STUB_CELLS,
    y: dockEnd.y + exitDirEnd.dy * cellSize * STUB_CELLS,
  }

  // Try routing with different parameters - progressively smaller cell sizes
  const attempts: { cellSize: number; margin: number }[] = [
    { cellSize: 10, margin: 10 },
    { cellSize: 8, margin: 8 },
    { cellSize: 5, margin: 6 },
    { cellSize: 5, margin: 4 },
    { cellSize: 3, margin: 4 },
    { cellSize: 3, margin: 2 },
    { cellSize: 2, margin: 2 },
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
    if (result && !pathCrossesAnyRect(result, rects, from.rectId, to.rectId)) {
      // Ensure all segments are orthogonal
      return ensureOrthogonal(result)
    }
  }

  // Last resort: try to find ANY valid path with very small cells
  const lastResort = tryRoute(
    dockStart,
    stubStart,
    stubEnd,
    dockEnd,
    rects,
    room,
    from.rectId,
    to.rectId,
    2,
    1
  )
  
  if (lastResort && !pathCrossesAnyRect(lastResort, rects, from.rectId, to.rectId)) {
    return ensureOrthogonal(lastResort)
  }

  // If still no valid path, create a path that goes around via room edges
  const edgePath = createEdgePath(dockStart, dockEnd, fromRect, toRect, from.side, to.side, room)
  return ensureOrthogonal(edgePath)
}

// Ensures all segments are strictly horizontal or vertical
// If a diagonal segment is found, it's split into two orthogonal segments
function ensureOrthogonal(points: number[]): number[] {
  if (points.length < 4) return points

  const result: number[] = [points[0], points[1]]

  for (let i = 2; i < points.length; i += 2) {
    const prevX = result[result.length - 2]
    const prevY = result[result.length - 1]
    const currX = points[i]
    const currY = points[i + 1]

    const dx = currX - prevX
    const dy = currY - prevY

    // Check if segment is diagonal (both dx and dy are non-zero)
    if (Math.abs(dx) > 0.5 && Math.abs(dy) > 0.5) {
      // Split into two orthogonal segments: first horizontal, then vertical
      result.push(currX, prevY) // Intermediate point
      result.push(currX, currY) // Final point
    } else {
      result.push(currX, currY)
    }
  }

  return result
}

function tryRoute(
  dockStart: { x: number; y: number },
  stubStart: { x: number; y: number },
  stubEnd: { x: number; y: number },
  dockEnd: { x: number; y: number },
  rects: RectNode[],
  room: Room,
  _fromRectId: string,
  _toRectId: string,
  cellSize: number,
  margin: number
): number[] | null {
  // Build grid - ALL rects are obstacles (we route between stub points outside rects)
  const blocked = buildObstacleGrid(room, rects, margin, cellSize)

  // Unblock the stub points specifically
  const startGrid = worldToGrid(stubStart.x, stubStart.y, cellSize)
  const endGrid = worldToGrid(stubEnd.x, stubEnd.y, cellSize)
  
  // Make sure stub points are not blocked
  blocked.delete(`${startGrid.gx},${startGrid.gy}`)
  blocked.delete(`${endGrid.gx},${endGrid.gy}`)

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

    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y

    // Determine direction - be strict about orthogonality
    const isHorizontal1 = Math.abs(dx1) > 0.5 && Math.abs(dy1) <= 0.5
    const isVertical1 = Math.abs(dy1) > 0.5 && Math.abs(dx1) <= 0.5
    const isHorizontal2 = Math.abs(dx2) > 0.5 && Math.abs(dy2) <= 0.5
    const isVertical2 = Math.abs(dy2) > 0.5 && Math.abs(dx2) <= 0.5

    // If direction changes or it's a diagonal, keep this point
    const sameDirection = (isHorizontal1 && isHorizontal2) || (isVertical1 && isVertical2)
    
    if (!sameDirection) {
      result.push(curr)
    }
  }

  result.push(path[path.length - 1])

  return result
}

// Check if a path crosses any rectangle (except start/end rects at dock points)
function pathCrossesAnyRect(
  points: number[],
  rects: RectNode[],
  fromRectId: string,
  toRectId: string
): boolean {
  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i]
    const y1 = points[i + 1]
    const x2 = points[i + 2]
    const y2 = points[i + 3]

    for (const rect of rects) {
      // Skip start/end rects for the first/last segment only
      const isFirstSegment = i === 0
      const isLastSegment = i === points.length - 4
      
      if (isFirstSegment && rect.id === fromRectId) continue
      if (isLastSegment && rect.id === toRectId) continue

      if (segmentIntersectsRect(x1, y1, x2, y2, rect)) {
        return true
      }
    }
  }

  return false
}

function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: RectNode
): boolean {
  const left = rect.x
  const right = rect.x + rect.width
  const top = rect.y
  const bottom = rect.y + rect.height

  // Check if segment is completely outside
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  if (maxX < left || minX > right || maxY < top || minY > bottom) {
    return false
  }

  // Horizontal segment
  if (Math.abs(y1 - y2) < 0.5) {
    // Check if y is within rect and x range overlaps
    if (y1 > top && y1 < bottom) {
      if (maxX > left && minX < right) {
        return true
      }
    }
  }

  // Vertical segment
  if (Math.abs(x1 - x2) < 0.5) {
    // Check if x is within rect and y range overlaps
    if (x1 > left && x1 < right) {
      if (maxY > top && minY < bottom) {
        return true
      }
    }
  }

  return false
}

// Create a path that goes around via room edges when direct routing fails
function createEdgePath(
  dockStart: { x: number; y: number },
  dockEnd: { x: number; y: number },
  fromRect: RectNode,
  _toRect: RectNode,
  fromSide: DockSide,
  toSide: DockSide,
  room: Room
): number[] {
  const margin = 20
  const exitDir = getExitDirection(fromSide)
  const entryDir = getExitDirection(toSide)

  const points: { x: number; y: number }[] = []
  
  // Start at dock
  points.push({ x: dockStart.x, y: dockStart.y })

  // First exit point - move orthogonally from dock
  const exitPoint = {
    x: dockStart.x + exitDir.dx * margin,
    y: dockStart.y + exitDir.dy * margin,
  }
  points.push(exitPoint)

  // Entry point - where we need to arrive before the final dock
  const entryPoint = {
    x: dockEnd.x + entryDir.dx * margin,
    y: dockEnd.y + entryDir.dy * margin,
  }

  // Determine which edge to use based on positions
  const centerStart = { x: fromRect.x + fromRect.width / 2, y: fromRect.y + fromRect.height / 2 }

  // Create intermediate orthogonal path
  if (exitDir.dx !== 0) {
    // Horizontal exit
    if (entryDir.dx !== 0) {
      // Both horizontal - go via top or bottom edge
      const goTop = centerStart.y > room.height / 2
      const edgeY = goTop ? margin : room.height - margin
      // First go vertical to edge
      points.push({ x: exitPoint.x, y: edgeY })
      // Then go horizontal to entry x
      points.push({ x: entryPoint.x, y: edgeY })
    } else {
      // Exit horizontal, entry vertical - L-shaped path
      points.push({ x: entryPoint.x, y: exitPoint.y })
    }
  } else {
    // Vertical exit
    if (entryDir.dy !== 0) {
      // Both vertical - go via left or right edge
      const goLeft = centerStart.x > room.width / 2
      const edgeX = goLeft ? margin : room.width - margin
      // First go horizontal to edge
      points.push({ x: edgeX, y: exitPoint.y })
      // Then go vertical to entry y
      points.push({ x: edgeX, y: entryPoint.y })
    } else {
      // Exit vertical, entry horizontal - L-shaped path
      points.push({ x: exitPoint.x, y: entryPoint.y })
    }
  }

  // Add entry point
  points.push(entryPoint)
  
  // End at dock
  points.push({ x: dockEnd.x, y: dockEnd.y })

  // Simplify and convert to flat array
  const simplified = simplifyPath(points)
  
  const result: number[] = []
  for (const p of simplified) {
    result.push(p.x, p.y)
  }

  return result
}

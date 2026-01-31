import type { RectNode, Room } from '../../state/store'

export const DEFAULT_CELL_SIZE = 10

export type GridNode = {
  gx: number
  gy: number
  blocked: boolean
}

export function worldToGrid(x: number, y: number, cellSize: number): { gx: number; gy: number } {
  return {
    gx: Math.round(x / cellSize),
    gy: Math.round(y / cellSize),
  }
}

export function gridToWorld(gx: number, gy: number, cellSize: number): { x: number; y: number } {
  return {
    x: gx * cellSize,
    y: gy * cellSize,
  }
}

export function buildObstacleGrid(
  room: Room,
  rects: RectNode[],
  marginPx: number,
  cellSize: number = DEFAULT_CELL_SIZE
): Set<string> {
  const blocked = new Set<string>()

  const gridWidth = Math.ceil(room.width / cellSize)
  const gridHeight = Math.ceil(room.height / cellSize)

  // Include some cells outside for routing exploration, but mark them as blocked
  const extraCells = 10

  for (let gy = -extraCells; gy <= gridHeight + extraCells; gy++) {
    for (let gx = -extraCells; gx <= gridWidth + extraCells; gx++) {
      const { x, y } = gridToWorld(gx, gy, cellSize)

      // STRICT: Block cells outside the room boundaries
      if (x < 0 || x > room.width || y < 0 || y > room.height) {
        blocked.add(`${gx},${gy}`)
        continue
      }

      // Check if point is inside any expanded rect
      for (const rect of rects) {
        const left = rect.x - marginPx
        const right = rect.x + rect.width + marginPx
        const top = rect.y - marginPx
        const bottom = rect.y + rect.height + marginPx

        if (x >= left && x <= right && y >= top && y <= bottom) {
          blocked.add(`${gx},${gy}`)
          break
        }
      }
    }
  }

  return blocked
}

export function isBlocked(blocked: Set<string>, gx: number, gy: number): boolean {
  return blocked.has(`${gx},${gy}`)
}

export function getKey(gx: number, gy: number): string {
  return `${gx},${gy}`
}

// Clamp a point to be within room boundaries
export function clampToRoom(x: number, y: number, room: Room): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(room.width, x)),
    y: Math.max(0, Math.min(room.height, y)),
  }
}

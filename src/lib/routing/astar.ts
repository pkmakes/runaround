import { isBlocked, getKey } from './grid'

type Node = {
  gx: number
  gy: number
  g: number
  h: number
  f: number
  parent: Node | null
  direction: string | null
}

const DIRECTIONS = [
  { dx: 0, dy: -1, name: 'up' },
  { dx: 1, dy: 0, name: 'right' },
  { dx: 0, dy: 1, name: 'down' },
  { dx: -1, dy: 0, name: 'left' },
]

const BASE_COST = 1
const TURN_PENALTY = 3

export function astar(
  startGx: number,
  startGy: number,
  endGx: number,
  endGy: number,
  blocked: Set<string>,
  roomGridWidth: number,
  roomGridHeight: number
): { gx: number; gy: number }[] | null {
  const openSet: Node[] = []
  const closedSet = new Set<string>()

  const heuristic = (gx: number, gy: number) =>
    Math.abs(gx - endGx) + Math.abs(gy - endGy)

  const startNode: Node = {
    gx: startGx,
    gy: startGy,
    g: 0,
    h: heuristic(startGx, startGy),
    f: heuristic(startGx, startGy),
    parent: null,
    direction: null,
  }

  openSet.push(startNode)

  let iterations = 0
  const maxIterations = roomGridWidth * roomGridHeight * 4

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++

    // Find node with lowest f
    openSet.sort((a, b) => a.f - b.f)
    const current = openSet.shift()!

    if (current.gx === endGx && current.gy === endGy) {
      // Reconstruct path
      const path: { gx: number; gy: number }[] = []
      let node: Node | null = current
      while (node) {
        path.unshift({ gx: node.gx, gy: node.gy })
        node = node.parent
      }
      return path
    }

    closedSet.add(getKey(current.gx, current.gy))

    for (const dir of DIRECTIONS) {
      const nextGx = current.gx + dir.dx
      const nextGy = current.gy + dir.dy
      const key = getKey(nextGx, nextGy)

      if (closedSet.has(key)) continue
      if (isBlocked(blocked, nextGx, nextGy)) continue

      // Check bounds
      if (nextGx < -5 || nextGx > roomGridWidth + 5) continue
      if (nextGy < -5 || nextGy > roomGridHeight + 5) continue

      // Calculate cost
      let moveCost = BASE_COST
      if (current.direction && current.direction !== dir.name) {
        moveCost += TURN_PENALTY
      }

      const g = current.g + moveCost
      const h = heuristic(nextGx, nextGy)
      const f = g + h

      // Check if already in open set with better score
      const existing = openSet.find((n) => n.gx === nextGx && n.gy === nextGy)
      if (existing && existing.g <= g) continue

      if (existing) {
        existing.g = g
        existing.f = f
        existing.parent = current
        existing.direction = dir.name
      } else {
        openSet.push({
          gx: nextGx,
          gy: nextGy,
          g,
          h,
          f,
          parent: current,
          direction: dir.name,
        })
      }
    }
  }

  return null
}


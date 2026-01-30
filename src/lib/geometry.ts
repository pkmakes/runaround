import type { DockSide, RectNode } from '../state/store'

export function getDockPoint(
  rect: RectNode,
  side: DockSide
): { x: number; y: number } {
  switch (side) {
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y }
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 }
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height }
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 }
  }
}

export function getExitDirection(side: DockSide): { dx: number; dy: number } {
  switch (side) {
    case 'top':
      return { dx: 0, dy: -1 }
    case 'right':
      return { dx: 1, dy: 0 }
    case 'bottom':
      return { dx: 0, dy: 1 }
    case 'left':
      return { dx: -1, dy: 0 }
  }
}

export function manhattanLength(points: number[]): number {
  let total = 0
  for (let i = 0; i < points.length - 2; i += 2) {
    const dx = Math.abs(points[i + 2] - points[i])
    const dy = Math.abs(points[i + 3] - points[i + 1])
    total += dx + dy
  }
  return Math.round(total)
}

export function rectContainsPoint(
  rect: RectNode,
  x: number,
  y: number,
  margin: number = 0
): boolean {
  return (
    x >= rect.x - margin &&
    x <= rect.x + rect.width + margin &&
    y >= rect.y - margin &&
    y <= rect.y + rect.height + margin
  )
}

export function segmentIntersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rect: RectNode,
  margin: number
): boolean {
  const left = rect.x - margin
  const right = rect.x + rect.width + margin
  const top = rect.y - margin
  const bottom = rect.y + rect.height + margin

  // Horizontal segment
  if (y1 === y2) {
    const minX = Math.min(x1, x2)
    const maxX = Math.max(x1, x2)
    if (y1 >= top && y1 <= bottom) {
      if (maxX >= left && minX <= right) {
        return true
      }
    }
  }

  // Vertical segment
  if (x1 === x2) {
    const minY = Math.min(y1, y2)
    const maxY = Math.max(y1, y2)
    if (x1 >= left && x1 <= right) {
      if (maxY >= top && minY <= bottom) {
        return true
      }
    }
  }

  return false
}


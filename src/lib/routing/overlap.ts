// Overlap offset logic for collinear path segments

const ARROW_WIDTH = 6
const OFFSET_STEP = ARROW_WIDTH + 2

export function applyOverlapOffset(
  newPoints: number[],
  existingPaths: { points: number[] }[]
): number[] {
  if (newPoints.length < 4) return newPoints

  for (let attempt = 0; attempt < 5; attempt++) {
    const offset = attempt * OFFSET_STEP
    const offsetPoints = offsetPath(newPoints, offset)

    let hasOverlap = false
    for (const existing of existingPaths) {
      if (pathsOverlap(offsetPoints, existing.points)) {
        hasOverlap = true
        break
      }
    }

    if (!hasOverlap) {
      return offsetPoints
    }
  }

  // Max attempts reached, return with max offset
  return offsetPath(newPoints, 5 * OFFSET_STEP)
}

function offsetPath(points: number[], offset: number): number[] {
  if (offset === 0) return points

  const result: number[] = []

  for (let i = 0; i < points.length; i += 2) {
    const x = points[i]
    const y = points[i + 1]

    // Determine segment direction and offset perpendicular
    let offsetX = 0
    let offsetY = 0

    if (i > 0 && i < points.length - 2) {
      const prevX = points[i - 2]
      const prevY = points[i - 1]
      const nextX = points[i + 2]
      const nextY = points[i + 3]

      // Check if horizontal or vertical segment
      if (prevY === y || nextY === y) {
        // Horizontal segment: offset in +y
        offsetY = offset
      } else if (prevX === x || nextX === x) {
        // Vertical segment: offset in +x
        offsetX = offset
      }
    } else if (i === 0 && points.length >= 4) {
      const nextX = points[2]
      const nextY = points[3]
      if (y === nextY) {
        offsetY = offset
      } else if (x === nextX) {
        offsetX = offset
      }
    } else if (i === points.length - 2 && points.length >= 4) {
      const prevX = points[i - 2]
      const prevY = points[i - 1]
      if (y === prevY) {
        offsetY = offset
      } else if (x === prevX) {
        offsetX = offset
      }
    }

    result.push(x + offsetX, y + offsetY)
  }

  return result
}

function pathsOverlap(path1: number[], path2: number[]): boolean {
  // Check if any segments are collinear and overlapping
  const segments1 = getSegments(path1)
  const segments2 = getSegments(path2)

  for (const seg1 of segments1) {
    for (const seg2 of segments2) {
      if (segmentsOverlap(seg1, seg2)) {
        return true
      }
    }
  }

  return false
}

type Segment = {
  x1: number
  y1: number
  x2: number
  y2: number
  isHorizontal: boolean
}

function getSegments(points: number[]): Segment[] {
  const segments: Segment[] = []

  for (let i = 0; i < points.length - 2; i += 2) {
    const x1 = points[i]
    const y1 = points[i + 1]
    const x2 = points[i + 2]
    const y2 = points[i + 3]

    segments.push({
      x1,
      y1,
      x2,
      y2,
      isHorizontal: y1 === y2,
    })
  }

  return segments
}

function segmentsOverlap(seg1: Segment, seg2: Segment): boolean {
  // Both must be same orientation
  if (seg1.isHorizontal !== seg2.isHorizontal) return false

  if (seg1.isHorizontal) {
    // Both horizontal - check if same y and x ranges overlap
    if (Math.abs(seg1.y1 - seg2.y1) > 1) return false

    const min1 = Math.min(seg1.x1, seg1.x2)
    const max1 = Math.max(seg1.x1, seg1.x2)
    const min2 = Math.min(seg2.x1, seg2.x2)
    const max2 = Math.max(seg2.x1, seg2.x2)

    return max1 > min2 && max2 > min1
  } else {
    // Both vertical - check if same x and y ranges overlap
    if (Math.abs(seg1.x1 - seg2.x1) > 1) return false

    const min1 = Math.min(seg1.y1, seg1.y2)
    const max1 = Math.max(seg1.y1, seg1.y2)
    const min2 = Math.min(seg2.y1, seg2.y2)
    const max2 = Math.max(seg2.y1, seg2.y2)

    return max1 > min2 && max2 > min1
  }
}


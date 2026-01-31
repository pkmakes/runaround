// Overlap detection logic for collinear path segments
// Instead of offsetting, we increase line thickness for overlapping segments

export type Segment = {
  x1: number
  y1: number
  x2: number
  y2: number
  isHorizontal: boolean
}

export type SegmentWithThickness = Segment & {
  thickness: number
  segmentIndex: number
}

const DEFAULT_BASE_THICKNESS = 2

export function getSegmentsFromPoints(points: number[]): Segment[] {
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

function segmentsAreCollinearAndOverlap(seg1: Segment, seg2: Segment): boolean {
  // Both must be same orientation
  if (seg1.isHorizontal !== seg2.isHorizontal) return false

  if (seg1.isHorizontal) {
    // Both horizontal - check if same y and x ranges overlap
    if (Math.abs(seg1.y1 - seg2.y1) > 0.5) return false

    const min1 = Math.min(seg1.x1, seg1.x2)
    const max1 = Math.max(seg1.x1, seg1.x2)
    const min2 = Math.min(seg2.x1, seg2.x2)
    const max2 = Math.max(seg2.x1, seg2.x2)

    return max1 > min2 && max2 > min1
  } else {
    // Both vertical - check if same x and y ranges overlap
    if (Math.abs(seg1.x1 - seg2.x1) > 0.5) return false

    const min1 = Math.min(seg1.y1, seg1.y2)
    const max1 = Math.max(seg1.y1, seg1.y2)
    const min2 = Math.min(seg2.y1, seg2.y2)
    const max2 = Math.max(seg2.y1, seg2.y2)

    return max1 > min2 && max2 > min1
  }
}

// Calculate thickness for each segment based on overlaps with other paths
export function calculateSegmentThicknesses(
  pathPoints: number[],
  allPathsPoints: number[][],
  baseThickness: number = DEFAULT_BASE_THICKNESS
): SegmentWithThickness[] {
  const segments = getSegmentsFromPoints(pathPoints)
  
  // Collect all segments from all other paths
  const otherSegments: Segment[] = []
  for (const otherPoints of allPathsPoints) {
    if (otherPoints === pathPoints) continue
    otherSegments.push(...getSegmentsFromPoints(otherPoints))
  }

  // Calculate thickness for each segment
  return segments.map((segment, index) => {
    let overlapCount = 1 // Start with 1 (this segment itself)
    
    for (const other of otherSegments) {
      if (segmentsAreCollinearAndOverlap(segment, other)) {
        overlapCount++
      }
    }

    return {
      ...segment,
      thickness: overlapCount * baseThickness,
      segmentIndex: index,
    }
  })
}

// Get all overlapping segment groups for visual highlighting
export function getOverlapInfo(
  allPathsPoints: number[][]
): Map<string, number> {
  const allSegments: { segment: Segment; pathIndex: number }[] = []
  
  allPathsPoints.forEach((points, pathIndex) => {
    const segments = getSegmentsFromPoints(points)
    segments.forEach((segment) => {
      allSegments.push({ segment, pathIndex })
    })
  })

  // Count overlaps for each unique position
  const overlapCounts = new Map<string, number>()
  
  for (let i = 0; i < allSegments.length; i++) {
    for (let j = i + 1; j < allSegments.length; j++) {
      if (segmentsAreCollinearAndOverlap(allSegments[i].segment, allSegments[j].segment)) {
        // Create a key for this overlap region
        const seg1 = allSegments[i].segment
        const seg2 = allSegments[j].segment
        
        if (seg1.isHorizontal) {
          const y = seg1.y1
          const minX = Math.max(Math.min(seg1.x1, seg1.x2), Math.min(seg2.x1, seg2.x2))
          const maxX = Math.min(Math.max(seg1.x1, seg1.x2), Math.max(seg2.x1, seg2.x2))
          const key = `h:${y}:${minX}:${maxX}`
          overlapCounts.set(key, (overlapCounts.get(key) || 1) + 1)
        } else {
          const x = seg1.x1
          const minY = Math.max(Math.min(seg1.y1, seg1.y2), Math.min(seg2.y1, seg2.y2))
          const maxY = Math.min(Math.max(seg1.y1, seg1.y2), Math.max(seg2.y1, seg2.y2))
          const key = `v:${x}:${minY}:${maxY}`
          overlapCounts.set(key, (overlapCounts.get(key) || 1) + 1)
        }
      }
    }
  }

  return overlapCounts
}

import { Line, Arrow } from 'react-konva'
import { usePaths } from '../state/selectors'
import { calculateSegmentThicknesses } from '../lib/routing/overlap'
import { useMemo } from 'react'

const ARROW_POINTER_LENGTH = 12
const ARROW_POINTER_WIDTH = 10
const BASE_COLOR = '#e94560'

export function PathLayer() {
  const paths = usePaths()

  // Collect all path points for overlap calculation
  const allPathsPoints = useMemo(() => paths.map((p) => p.points), [paths])

  return (
    <>
      {paths.map((path) => {
        if (path.points.length < 4) return null

        // Calculate thickness for each segment
        const segmentsWithThickness = calculateSegmentThicknesses(
          path.points,
          allPathsPoints
        )

        // Get the last segment for arrow direction
        const lastSegment = segmentsWithThickness[segmentsWithThickness.length - 1]
        const lastThickness = lastSegment?.thickness || 2

        return (
          <PathWithSegments
            key={path.id}
            segmentsWithThickness={segmentsWithThickness}
            lastThickness={lastThickness}
          />
        )
      })}
    </>
  )
}

type SegmentData = {
  x1: number
  y1: number
  x2: number
  y2: number
  thickness: number
}

function PathWithSegments({
  segmentsWithThickness,
  lastThickness,
}: {
  segmentsWithThickness: SegmentData[]
  lastThickness: number
}) {
  // Render each segment with its calculated thickness
  // But use a single arrow for the end to show direction

  if (segmentsWithThickness.length === 0) return null

  // For the main body, render lines for each segment
  // For the last segment, render an arrow

  const lastIdx = segmentsWithThickness.length - 1

  return (
    <>
      {/* Render all segments except the last as lines */}
      {segmentsWithThickness.slice(0, -1).map((seg, idx) => (
        <Line
          key={`seg-${idx}`}
          points={[seg.x1, seg.y1, seg.x2, seg.y2]}
          stroke={BASE_COLOR}
          strokeWidth={seg.thickness}
          lineCap="round"
          lineJoin="round"
          shadowColor="rgba(233, 69, 96, 0.4)"
          shadowBlur={4}
          shadowOpacity={0.5}
        />
      ))}

      {/* Render the last segment as an arrow */}
      {segmentsWithThickness.length > 0 && (
        <Arrow
          points={[
            segmentsWithThickness[lastIdx].x1,
            segmentsWithThickness[lastIdx].y1,
            segmentsWithThickness[lastIdx].x2,
            segmentsWithThickness[lastIdx].y2,
          ]}
          stroke={BASE_COLOR}
          strokeWidth={lastThickness}
          fill={BASE_COLOR}
          pointerLength={ARROW_POINTER_LENGTH}
          pointerWidth={ARROW_POINTER_WIDTH}
          lineCap="round"
          lineJoin="round"
          shadowColor="rgba(233, 69, 96, 0.4)"
          shadowBlur={4}
          shadowOpacity={0.5}
        />
      )}

      {/* Draw corner circles to smooth transitions between different thicknesses */}
      {segmentsWithThickness.slice(0, -1).map((seg, idx) => {
        const nextSeg = segmentsWithThickness[idx + 1]
        if (!nextSeg) return null
        
        const maxThickness = Math.max(seg.thickness, nextSeg.thickness)
        
        return (
          <Line
            key={`corner-${idx}`}
            points={[seg.x2, seg.y2]}
            stroke={BASE_COLOR}
            strokeWidth={maxThickness}
            lineCap="round"
          />
        )
      })}
    </>
  )
}

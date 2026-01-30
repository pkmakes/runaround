import { Arrow } from 'react-konva'
import { usePaths } from '../state/selectors'

const ARROW_STROKE_WIDTH = 6
const ARROW_POINTER_LENGTH = 12
const ARROW_POINTER_WIDTH = 10

export function PathLayer() {
  const paths = usePaths()

  return (
    <>
      {paths.map((path) => {
        if (path.points.length < 4) return null

        return (
          <Arrow
            key={path.id}
            points={path.points}
            stroke="#e94560"
            strokeWidth={ARROW_STROKE_WIDTH}
            fill="#e94560"
            pointerLength={ARROW_POINTER_LENGTH}
            pointerWidth={ARROW_POINTER_WIDTH}
            lineCap="round"
            lineJoin="round"
            tension={0}
            shadowColor="rgba(233, 69, 96, 0.5)"
            shadowBlur={8}
            shadowOpacity={0.5}
          />
        )
      })}
    </>
  )
}


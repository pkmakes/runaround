import { useRef, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import { RoomLayer } from './RoomLayer'
import { RectLayer } from './RectLayer'
import { PathLayer } from './PathLayer'
import { Dockpoints } from './Dockpoints'
import { useRoom } from '../state/selectors'
import { stageRef } from './stageRef'

export function StageView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const room = useRoom()
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setContainerSize({ width, height })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const padding = 40
  const scaleX = (containerSize.width - padding * 2) / room.width
  const scaleY = (containerSize.height - padding * 2) / room.height
  const scale = Math.min(scaleX, scaleY, 1)

  const offsetX = (containerSize.width - room.width * scale) / 2
  const offsetY = (containerSize.height - room.height * scale) / 2

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', position: 'absolute' }}
    >
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        scaleX={scale}
        scaleY={scale}
        x={offsetX}
        y={offsetY}
      >
        <Layer>
          <RoomLayer />
          <RectLayer />
          <PathLayer />
          <Dockpoints />
        </Layer>
      </Stage>
    </div>
  )
}

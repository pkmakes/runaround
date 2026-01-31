import { useRef, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { RoomLayer } from './RoomLayer'
import { RectLayer } from './RectLayer'
import { PathLayer } from './PathLayer'
import { Dockpoints } from './Dockpoints'
import { useRoom, useUIMode } from '../state/selectors'
import { useStore } from '../state/store'
import { stageRef } from './stageRef'

export function StageView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const room = useRoom()
  const mode = useUIMode()
  const setState = useStore((s) => s.setState)
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const { width, height } = container.getBoundingClientRect()
      setContainerSize({ width, height })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  const padding = 10
  const scaleX = (containerSize.width - padding * 2) / room.width
  const scaleY = (containerSize.height - padding * 2) / room.height
  const scale = Math.min(scaleX, scaleY, 1)

  const offsetX = (containerSize.width - room.width * scale) / 2
  const offsetY = (containerSize.height - room.height * scale) / 2

  // Klick auf leere Stelle deselektiert alles
  const handleStageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Layer'
    if (!clickedOnEmpty) return
    
    // Im Layout- und Laufweg-Modus: Alles deselektieren
    if (mode === 'layout') {
      setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: null, hoveredPathId: null } })
    } else if (mode === 'addPath') {
      setState({ ui: { mode: 'addPath', pendingStart: null, selectedRectId: null, editingRectId: null, selectedPathId: null, hoveredPathId: null } })
    }
  }

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
        onClick={handleStageClick}
        onTap={handleStageClick}
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

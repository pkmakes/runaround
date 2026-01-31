import { Rect, Text, Group } from 'react-konva'
import { useRects, useRoom, useSelectedRectId, useUIMode, useRectFontSize } from '../state/selectors'
import { useStore } from '../state/store'
import { useState, useCallback } from 'react'
import { routePath } from '../lib/routing/router'

const HANDLE_SIZE = 10
const MIN_SIZE = 40
const DEFAULT_COLOR = '#d1d5db'

// Berechnet ob der Text dunkel oder hell sein soll basierend auf der Hintergrundfarbe
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // Helligkeit berechnen (YIQ-Formel)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#1f2933' : '#ffffff'
}

// Erzeugt eine dunklere Version einer Farbe für den Rahmen
function darkenColor(hexColor: string, amount: number = 0.2): string {
  const hex = hexColor.replace('#', '')
  const r = Math.max(0, Math.round(parseInt(hex.substring(0, 2), 16) * (1 - amount)))
  const g = Math.max(0, Math.round(parseInt(hex.substring(2, 4), 16) * (1 - amount)))
  const b = Math.max(0, Math.round(parseInt(hex.substring(4, 6), 16) * (1 - amount)))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Berechnet die optimale Schriftgröße für den Text im Rechteck
function calculateFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  baseFontSize: number = 12,
  minFontSize: number = 6
): number {
  const padding = 8
  const availableWidth = maxWidth - padding * 2
  const availableHeight = maxHeight - padding * 2
  
  // Grobe Schätzung: durchschnittliche Zeichenbreite ist etwa 0.6 * fontSize
  // Zeilenhöhe ist etwa 1.2 * fontSize
  
  let fontSize = baseFontSize
  
  while (fontSize >= minFontSize) {
    const charWidth = fontSize * 0.55
    const lineHeight = fontSize * 1.3
    
    // Wie viele Zeichen passen pro Zeile?
    const charsPerLine = Math.floor(availableWidth / charWidth)
    if (charsPerLine < 1) {
      fontSize -= 1
      continue
    }
    
    // Wie viele Zeilen werden benötigt?
    const words = text.split(/\s+/)
    let lines = 1
    let currentLineLength = 0
    
    for (const word of words) {
      if (currentLineLength + word.length + 1 > charsPerLine) {
        lines++
        currentLineLength = word.length
      } else {
        currentLineLength += (currentLineLength > 0 ? 1 : 0) + word.length
      }
    }
    
    // Passt der Text in die verfügbare Höhe?
    const requiredHeight = lines * lineHeight
    if (requiredHeight <= availableHeight) {
      return fontSize
    }
    
    fontSize -= 1
  }
  
  return minFontSize
}

export function RectLayer() {
  const rects = useRects()
  const room = useRoom()
  const selectedRectId = useSelectedRectId()
  const mode = useUIMode()
  const rectFontSize = useRectFontSize()
  const updateRect = useStore((s) => s.updateRect)
  const setState = useStore((s) => s.setState)
  const recomputeAllPaths = useStore((s) => s.recomputeAllPaths)

  const [resizingId, setResizingId] = useState<string | null>(null)

  const handleSelect = (id: string) => {
    if (mode === 'layout') {
      setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: id, editingRectId: null, selectedPathId: null } })
    }
  }

  const handleDoubleClick = (id: string) => {
    if (mode === 'layout') {
      setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: id, editingRectId: id, selectedPathId: null } })
    }
  }

  const triggerRecompute = useCallback(() => {
    recomputeAllPaths(routePath)
  }, [recomputeAllPaths])

  return (
    <>
      {rects.map((rect) => {
        const isSelected = selectedRectId === rect.id
        const isResizing = resizingId === rect.id

        const rectColor = rect.color || DEFAULT_COLOR
        const textColor = getContrastColor(rectColor)
        const strokeColor = isSelected ? '#10b981' : darkenColor(rectColor, 0.3)

        return (
          <Group key={rect.id}>
            {/* Rectangle */}
            <Rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rectColor}
              stroke={strokeColor}
              strokeWidth={isSelected ? 3 : 2}
              cornerRadius={4}
              shadowColor="black"
              shadowBlur={isSelected ? 10 : 5}
              shadowOpacity={0.3}
              draggable={mode === 'layout'}
              onClick={() => handleSelect(rect.id)}
              onTap={() => handleSelect(rect.id)}
              onDblClick={() => handleDoubleClick(rect.id)}
              onDblTap={() => handleDoubleClick(rect.id)}
              onDragMove={(e) => {
                const node = e.target
                let x = node.x()
                let y = node.y()

                // Clamp within room
                x = Math.max(0, Math.min(room.width - rect.width, x))
                y = Math.max(0, Math.min(room.height - rect.height, y))

                node.x(x)
                node.y(y)
              }}
              onDragEnd={(e) => {
                const node = e.target
                updateRect(rect.id, {
                  x: Math.round(node.x()),
                  y: Math.round(node.y()),
                })
                // Recompute all paths after rect move
                setTimeout(triggerRecompute, 0)
              }}
              onMouseEnter={(e) => {
                if (mode === 'layout') {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'move'
                }
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage()?.container()
                if (container) container.style.cursor = 'default'
              }}
            />

            {/* Name label */}
            <Text
              x={rect.x + 4}
              y={rect.y + 4}
              width={rect.width - 8}
              height={rect.height - 8}
              text={rect.name}
              fontSize={calculateFontSize(rect.name, rect.width, rect.height, rectFontSize)}
              fontFamily="Inter, system-ui, sans-serif"
              fill={textColor}
              align="center"
              verticalAlign="middle"
              wrap="word"
              listening={false}
            />

            {/* Resize handle */}
            {isSelected && (
              <Rect
                x={rect.x + rect.width - HANDLE_SIZE}
                y={rect.y + rect.height - HANDLE_SIZE}
                width={HANDLE_SIZE}
                height={HANDLE_SIZE}
                fill={isResizing ? '#ef4444' : '#10b981'}
                stroke="#ffffff"
                strokeWidth={1}
                cornerRadius={2}
                draggable
                onDragStart={() => setResizingId(rect.id)}
                onDragMove={(e) => {
                  const node = e.target
                  const handleX = node.x()
                  const handleY = node.y()

                  let newWidth = handleX - rect.x + HANDLE_SIZE
                  let newHeight = handleY - rect.y + HANDLE_SIZE

                  // Minimum size
                  newWidth = Math.max(MIN_SIZE, newWidth)
                  newHeight = Math.max(MIN_SIZE, newHeight)

                  // Clamp to room bounds
                  newWidth = Math.min(newWidth, room.width - rect.x)
                  newHeight = Math.min(newHeight, room.height - rect.y)

                  // Update immediately for visual feedback
                  updateRect(rect.id, {
                    width: Math.round(newWidth),
                    height: Math.round(newHeight),
                  })

                  // Keep handle at corner
                  node.x(rect.x + Math.round(newWidth) - HANDLE_SIZE)
                  node.y(rect.y + Math.round(newHeight) - HANDLE_SIZE)
                }}
                onDragEnd={() => {
                  setResizingId(null)
                  // Recompute all paths after rect resize
                  setTimeout(triggerRecompute, 0)
                }}
                onMouseEnter={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'nwse-resize'
                }}
                onMouseLeave={(e) => {
                  const container = e.target.getStage()?.container()
                  if (container) container.style.cursor = 'default'
                }}
              />
            )}
          </Group>
        )
      })}
    </>
  )
}

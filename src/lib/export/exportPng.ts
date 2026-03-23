import type Konva from 'konva'
import type { Room } from '../../state/store'
import { buildExportBaseName } from '../persistence/saveLoad'

export function exportPng(
  stage: Konva.Stage | null,
  room: Room,
  projectName: string
): void {
  if (!stage) {
    alert('Stage nicht verfügbar')
    return
  }

  const scale = stage.scaleX()
  const offsetX = stage.x()
  const offsetY = stage.y()

  // Export the full stage at 1× pixel ratio, then crop to exact room bounds
  const fullDataUrl = stage.toDataURL({ pixelRatio: 1 })

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = room.width
    canvas.height = room.height

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(
      img,
      offsetX,                  // source x (room left edge on full canvas)
      offsetY,                  // source y (room top edge on full canvas)
      room.width * scale,       // source width
      room.height * scale,      // source height
      0, 0,                     // destination x, y
      room.width,               // destination width = exact room width
      room.height               // destination height = exact room height
    )

    const link = document.createElement('a')
    link.download = `${buildExportBaseName(projectName)}.png`
    link.href = canvas.toDataURL('image/png')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  img.src = fullDataUrl
}

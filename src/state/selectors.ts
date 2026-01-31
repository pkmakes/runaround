import { useStore } from './store'
import type { PathRow } from './store'

export const useRoom = () => useStore((s) => s.room)
export const useRects = () => useStore((s) => s.rects)
export const usePaths = () => useStore((s) => s.paths)
export const usePathOrder = () => useStore((s) => s.pathOrder)
export const useUIMode = () => useStore((s) => s.ui.mode)
export const usePendingStart = () => useStore((s) => s.ui.pendingStart)
export const useSelectedRectId = () => useStore((s) => s.ui.selectedRectId)
export const useEditingRectId = () => useStore((s) => s.ui.editingRectId)
export const useSelectedPathId = () => useStore((s) => s.ui.selectedPathId)
export const useHasUnsavedChanges = () => useStore((s) => s.hasUnsavedChanges)
export const useRectFontSize = () => useStore((s) => s.rectFontSize)
export const usePathThickness = () => useStore((s) => s.pathThickness)

export const useOrderedPaths = (): PathRow[] => {
  const paths = useStore((s) => s.paths)
  const pathOrder = useStore((s) => s.pathOrder)
  return pathOrder
    .map((id) => paths.find((p) => p.id === id))
    .filter((p): p is PathRow => p !== undefined)
}


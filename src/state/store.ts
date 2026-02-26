import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export type DockSide = 'top' | 'right' | 'bottom' | 'left'

export type Room = { width: number; height: number }

export type RectNode = {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

export type PathFields = {
  description: string
  knackpunkt: string
  begruendung: string
  kommentar: string
}

export type PathRow = {
  id: string
  from: { rectId: string; side: DockSide }
  to: { rectId: string; side: DockSide }
  points: number[]
  fields: PathFields
  createdAt: number
  isManuallyEdited: boolean
  isPlaceholder?: boolean
}

export type AppState = {
  room: Room
  rects: RectNode[]
  paths: PathRow[]
  pathOrder: string[]
  rectFontSize: number
  pathThickness: number
  overlapSpacing: number
  hasUnsavedChanges: boolean
  ui: {
    mode: 'layout' | 'addPath'
    pendingStart: { rectId: string; side: DockSide } | null
    selectedRectId: string | null
    editingRectId: string | null
    selectedPathId: string | null
    hoveredPathId: string | null
  }
}

type Actions = {
  setRoomSize: (width: number, height: number) => void
  resizeRoomByHandle: (newWidth: number, newHeight: number) => void
  addRect: (rect: { width: number; height: number; name?: string }) => void
  updateRect: (id: string, patch: Partial<Omit<RectNode, 'id'>>) => void
  deleteRect: (id: string) => void
  setMode: (mode: AppState['ui']['mode']) => void
  setPendingStart: (start: { rectId: string; side: DockSide } | null) => void
  addPath: (
    from: { rectId: string; side: DockSide },
    to: { rectId: string; side: DockSide },
    points: number[]
  ) => void
  addEmptyPathRow: () => void
  updatePathFields: (id: string, patchFields: Partial<PathFields>) => void
  updatePathPoints: (id: string, points: number[]) => void
  deletePath: (id: string) => void
  reorderPaths: (newOrderIds: string[]) => void
  recomputeAllPaths: (router: (from: { rectId: string; side: DockSide }, to: { rectId: string; side: DockSide }, rects: RectNode[], room: Room) => number[]) => void
  setState: (state: Partial<AppState>) => void
  setRectFontSize: (size: number) => void
  setPathThickness: (thickness: number) => void
  setOverlapSpacing: (spacing: number) => void
  reset: () => void
  markAsSaved: () => void
}

const initialState: AppState = {
  room: { width: 1200, height: 600 },
  rects: [],
  paths: [],
  pathOrder: [],
  rectFontSize: 12,
  pathThickness: 2,
  overlapSpacing: 6,
  hasUnsavedChanges: false,
  ui: {
    mode: 'layout',
    pendingStart: null,
    selectedRectId: null,
    editingRectId: null,
    selectedPathId: null,
    hoveredPathId: null,
  },
}

let rectCounter = 1

export const useStore = create<AppState & Actions>()(
  immer((set) => ({
    ...initialState,

    setRoomSize: (width, height) =>
      set((state) => {
        state.room.width = Math.min(10000, Math.max(200, width))
        state.room.height = Math.min(5000, Math.max(200, height))
        state.hasUnsavedChanges = true
      }),

    resizeRoomByHandle: (newWidth, newHeight) =>
      set((state) => {
        state.room.width = Math.min(10000, Math.max(200, newWidth))
        state.room.height = Math.min(5000, Math.max(200, newHeight))
        state.hasUnsavedChanges = true
      }),

    addRect: ({ width, height, name }) =>
      set((state) => {
        const id = `rect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const rectName = name || `Rect ${rectCounter++}`
        const x = Math.min(50, state.room.width - width)
        const y = Math.min(50, state.room.height - height)
        state.rects.push({
          id,
          name: rectName,
          x: Math.max(0, x),
          y: Math.max(0, y),
          width,
          height,
          color: '#d1d5db', // Helles Grau als Standard
        })
        state.hasUnsavedChanges = true
      }),

    updateRect: (id, patch) =>
      set((state) => {
        const rect = state.rects.find((r) => r.id === id)
        if (rect) {
          Object.assign(rect, patch)
          state.hasUnsavedChanges = true
        }
      }),

    deleteRect: (id) =>
      set((state) => {
        state.rects = state.rects.filter((r) => r.id !== id)
        const pathIdsToRemove = state.paths
          .filter((p) => p.from.rectId === id || p.to.rectId === id)
          .map((p) => p.id)
        state.paths = state.paths.filter(
          (p) => p.from.rectId !== id && p.to.rectId !== id
        )
        state.pathOrder = state.pathOrder.filter(
          (pid) => !pathIdsToRemove.includes(pid)
        )
        if (state.ui.selectedRectId === id) {
          state.ui.selectedRectId = null
        }
        state.hasUnsavedChanges = true
      }),

    setMode: (mode) =>
      set((state) => {
        state.ui.mode = mode
        state.ui.pendingStart = null
      }),

    setPendingStart: (start) =>
      set((state) => {
        state.ui.pendingStart = start
      }),

    addPath: (from, to, points) =>
      set((state) => {
        const id = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const newPath: PathRow = {
          id,
          from,
          to,
          points,
          fields: {
            description: '',
            knackpunkt: '',
            begruendung: '',
            kommentar: '',
          },
          createdAt: Date.now(),
          isManuallyEdited: false,
        }
        state.paths.push(newPath)
        state.pathOrder.push(id)
        state.hasUnsavedChanges = true
      }),

    addEmptyPathRow: () =>
      set((state) => {
        const id = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const emptyPath: PathRow = {
          id,
          from: { rectId: '', side: 'top' },
          to: { rectId: '', side: 'top' },
          points: [],
          fields: {
            description: '',
            knackpunkt: '',
            begruendung: '',
            kommentar: '',
          },
          createdAt: Date.now(),
          isManuallyEdited: false,
          isPlaceholder: true,
        }
        state.paths.push(emptyPath)
        state.pathOrder.push(id)
        state.hasUnsavedChanges = true
      }),

    updatePathFields: (id, patchFields) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === id)
        if (path) {
          Object.assign(path.fields, patchFields)
          state.hasUnsavedChanges = true
        }
      }),

    updatePathPoints: (id, points) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === id)
        if (path) {
          path.points = points
          path.isManuallyEdited = true
          state.hasUnsavedChanges = true
        }
      }),

    deletePath: (id) =>
      set((state) => {
        state.paths = state.paths.filter((p) => p.id !== id)
        state.pathOrder = state.pathOrder.filter((pid) => pid !== id)
        state.hasUnsavedChanges = true
      }),

    reorderPaths: (newOrderIds) =>
      set((state) => {
        state.pathOrder = newOrderIds
        state.hasUnsavedChanges = true
      }),

    recomputeAllPaths: (router) =>
      set((state) => {
        const { rects, room, pathOrder } = state
        // Recompute in pathOrder sequence for deterministic overlap offset
        const recomputedPaths: { id: string; points: number[] }[] = []
        
        for (const pathId of pathOrder) {
          const path = state.paths.find((p) => p.id === pathId)
          if (!path) continue
          
          // Manuell bearbeitete Pfade nicht automatisch neu berechnen
          if (path.isManuallyEdited) continue
          
          const fromRect = rects.find((r) => r.id === path.from.rectId)
          const toRect = rects.find((r) => r.id === path.to.rectId)
          if (fromRect && toRect) {
            const newPoints = router(path.from, path.to, rects, room)
            recomputedPaths.push({ id: path.id, points: newPoints })
          }
        }
        
        // Apply recomputed points to state
        for (const { id, points } of recomputedPaths) {
          const path = state.paths.find((p) => p.id === id)
          if (path) {
            path.points = points
          }
        }
      }),

    setState: (newState) =>
      set((state) => {
        Object.assign(state, newState)
      }),

    setRectFontSize: (size) =>
      set((state) => {
        state.rectFontSize = Math.min(24, Math.max(8, size))
        state.hasUnsavedChanges = true
      }),

    setPathThickness: (thickness) =>
      set((state) => {
        state.pathThickness = Math.min(8, Math.max(1, thickness))
        state.hasUnsavedChanges = true
      }),

    setOverlapSpacing: (spacing) =>
      set((state) => {
        state.overlapSpacing = Math.min(12, Math.max(4, spacing))
        state.hasUnsavedChanges = true
      }),

    reset: () =>
      set(() => ({
        ...initialState,
        ui: { ...initialState.ui },
      })),

    markAsSaved: () =>
      set((state) => {
        state.hasUnsavedChanges = false
      }),
  }))
)


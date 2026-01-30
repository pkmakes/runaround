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
}

export type AppState = {
  room: Room
  rects: RectNode[]
  paths: PathRow[]
  pathOrder: string[]
  ui: {
    mode: 'select' | 'addRect' | 'addPath'
    pendingStart: { rectId: string; side: DockSide } | null
    selectedRectId: string | null
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
  updatePathFields: (id: string, patchFields: Partial<PathFields>) => void
  deletePath: (id: string) => void
  reorderPaths: (newOrderIds: string[]) => void
  recomputeAllPaths: (router: (from: { rectId: string; side: DockSide }, to: { rectId: string; side: DockSide }, rects: RectNode[], room: Room) => number[]) => void
  setState: (state: Partial<AppState>) => void
  reset: () => void
}

const initialState: AppState = {
  room: { width: 800, height: 600 },
  rects: [],
  paths: [],
  pathOrder: [],
  ui: {
    mode: 'select',
    pendingStart: null,
    selectedRectId: null,
  },
}

let rectCounter = 1

export const useStore = create<AppState & Actions>()(
  immer((set) => ({
    ...initialState,

    setRoomSize: (width, height) =>
      set((state) => {
        state.room.width = Math.max(200, width)
        state.room.height = Math.max(200, height)
      }),

    resizeRoomByHandle: (newWidth, newHeight) =>
      set((state) => {
        state.room.width = Math.max(200, newWidth)
        state.room.height = Math.max(200, newHeight)
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
        })
      }),

    updateRect: (id, patch) =>
      set((state) => {
        const rect = state.rects.find((r) => r.id === id)
        if (rect) {
          Object.assign(rect, patch)
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
        }
        state.paths.push(newPath)
        state.pathOrder.push(id)
      }),

    updatePathFields: (id, patchFields) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === id)
        if (path) {
          Object.assign(path.fields, patchFields)
        }
      }),

    deletePath: (id) =>
      set((state) => {
        state.paths = state.paths.filter((p) => p.id !== id)
        state.pathOrder = state.pathOrder.filter((pid) => pid !== id)
      }),

    reorderPaths: (newOrderIds) =>
      set((state) => {
        state.pathOrder = newOrderIds
      }),

    recomputeAllPaths: (router) =>
      set((state) => {
        const { rects, room, pathOrder } = state
        // Recompute in pathOrder sequence for deterministic overlap offset
        const recomputedPaths: { id: string; points: number[] }[] = []
        
        for (const pathId of pathOrder) {
          const path = state.paths.find((p) => p.id === pathId)
          if (!path) continue
          
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

    reset: () =>
      set(() => ({
        ...initialState,
        ui: { ...initialState.ui },
      })),
  }))
)


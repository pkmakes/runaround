import type { AppState } from '../../state/store'
import { ProjectSchema } from './schema'
import type { ProjectData } from './schema'

export function stateToProjectData(state: AppState): ProjectData {
  return {
    version: 1,
    room: state.room,
    rects: state.rects,
    paths: state.paths,
    pathOrder: state.pathOrder,
    overlapSpacing: state.overlapSpacing,
  }
}

export function downloadProjectJson(state: AppState): void {
  const data = stateToProjectData(state)
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `runaround-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function loadProjectJson(file: File): Promise<ProjectData> {
  const text = await file.text()
  const json = JSON.parse(text)
  const validated = ProjectSchema.parse(json)
  return validated
}

const STORAGE_KEY = 'runaround_project'

export function saveToLocalStorage(state: AppState): void {
  try {
    const data = stateToProjectData(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function loadFromLocalStorage(): ProjectData | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return null
    const data = JSON.parse(json)
    return ProjectSchema.parse(data)
  } catch (e) {
    console.error('Failed to load from localStorage:', e)
    return null
  }
}


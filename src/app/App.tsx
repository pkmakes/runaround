import { useEffect } from 'react'
import { Topbar } from './layout/Topbar'
import { Sidebar } from './layout/Sidebar'
import { MainCanvas } from './layout/MainCanvas'
import { useStore } from '../state/store'

function App() {
  const setPendingStart = useStore((s) => s.setPendingStart)
  const setMode = useStore((s) => s.setMode)
  const hasUnsavedChanges = useStore((s) => s.hasUnsavedChanges)

  // Handle ESC key to cancel pending path creation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingStart(null)
        setMode('layout')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setPendingStart, setMode])

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        // Modern browsers show a generic message, but we set returnValue for older browsers
        e.returnValue = 'Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  return (
    <div className="app-container">
      <Topbar />
      <Sidebar />
      <MainCanvas />
    </div>
  )
}

export default App


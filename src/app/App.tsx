import { useEffect } from 'react'
import { Topbar } from './layout/Topbar'
import { Sidebar } from './layout/Sidebar'
import { MainCanvas } from './layout/MainCanvas'
import { useStore } from '../state/store'

function App() {
  const setPendingStart = useStore((s) => s.setPendingStart)
  const setMode = useStore((s) => s.setMode)

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

  return (
    <div className="app-container">
      <Topbar />
      <Sidebar />
      <MainCanvas />
    </div>
  )
}

export default App


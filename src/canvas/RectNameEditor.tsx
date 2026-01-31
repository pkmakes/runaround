import { useState, useEffect, useRef } from 'react'
import { useEditingRectId, useRects } from '../state/selectors'
import { useStore } from '../state/store'

export function RectNameEditor() {
  const editingRectId = useEditingRectId()
  const rects = useRects()
  const updateRect = useStore((s) => s.updateRect)
  const setState = useStore((s) => s.setState)
  
  const editingRect = editingRectId ? rects.find(r => r.id === editingRectId) : null
  
  const [name, setName] = useState('')
  const [shouldSelect, setShouldSelect] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Schritt 1: Wenn editingRect sich ändert, setze den Namen und markiere für Selektion
  useEffect(() => {
    if (editingRect) {
      setName(editingRect.name)
      setShouldSelect(true)
    }
  }, [editingRect])

  // Schritt 2: NACH dem Render (wenn name gesetzt ist), fokussieren und selektieren
  useEffect(() => {
    if (shouldSelect && name && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
      setShouldSelect(false)
    }
  }, [shouldSelect, name])

  const handleConfirm = () => {
    if (editingRectId && name.trim()) {
      updateRect(editingRectId, { name: name.trim() })
    }
    closeEditor()
  }

  const closeEditor = () => {
    setState({ ui: { mode: 'layout', pendingStart: null, selectedRectId: editingRectId, editingRectId: null, selectedPathId: null } })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      closeEditor()
    }
  }

  if (!editingRect) return null

  // Calculate position based on canvas scaling
  // The editor will be positioned relative to the canvas container
  // We need to account for the stage's scale and offset
  
  return (
    <div 
      className="rect-name-editor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeEditor()
        }
      }}
    >
      <div 
        className="rect-name-editor"
        style={{
          // Position in center of screen for simplicity
          // Could be positioned over the rect with more complex calculation
        }}
      >
        <div className="rect-name-editor-header">
          <span>Name bearbeiten</span>
          <button className="rect-name-editor-close" onClick={closeEditor}>✕</button>
        </div>
        <div className="rect-name-editor-body">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rect-name-editor-input"
            placeholder="Name eingeben..."
          />
          <button className="rect-name-editor-confirm" onClick={handleConfirm}>
            Bestätigen
          </button>
        </div>
      </div>
    </div>
  )
}


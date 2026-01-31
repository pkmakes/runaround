import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PathRow as PathRowType } from '../state/store'
import { useStore } from '../state/store'
import { manhattanLength } from '../lib/geometry'
import { useRef, useEffect, useCallback } from 'react'

type Props = {
  path: PathRowType
  index: number
}

// Auto-resizing textarea component
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const maxLines = 10
  const lineHeight = 20 // px per line

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'
    
    // Calculate new height
    const maxHeight = maxLines * lineHeight
    const newHeight = Math.min(textarea.scrollHeight, maxHeight)
    
    textarea.style.height = `${newHeight}px`
    
    // Enable scrolling if content exceeds max height
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  return (
    <textarea
      ref={textareaRef}
      className="table-textarea"
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
      }}
      placeholder={placeholder}
      rows={1}
    />
  )
}

export function PathRow({ path, index }: Props) {
  const updatePathFields = useStore((s) => s.updatePathFields)
  const deletePath = useStore((s) => s.deletePath)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: path.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const distance = manhattanLength(path.points)

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <span className="drag-handle" {...attributes} {...listeners}>
          ⋮⋮
        </span>
      </td>
      <td>{index + 1}</td>
      <td>
        <AutoResizeTextarea
          value={path.fields.description}
          onChange={(value) =>
            updatePathFields(path.id, { description: value })
          }
          placeholder="Beschreibung..."
        />
      </td>
      <td>
        <AutoResizeTextarea
          value={path.fields.knackpunkt}
          onChange={(value) =>
            updatePathFields(path.id, { knackpunkt: value })
          }
          placeholder="Knackpunkt..."
        />
      </td>
      <td>
        <AutoResizeTextarea
          value={path.fields.begruendung}
          onChange={(value) =>
            updatePathFields(path.id, { begruendung: value })
          }
          placeholder="Begründung..."
        />
      </td>
      <td>
        <AutoResizeTextarea
          value={path.fields.kommentar}
          onChange={(value) =>
            updatePathFields(path.id, { kommentar: value })
          }
          placeholder="Kommentar..."
        />
      </td>
      <td style={{ textAlign: 'center', fontFamily: 'monospace', verticalAlign: 'top', paddingTop: '12px' }}>
        {distance}px
      </td>
      <td style={{ verticalAlign: 'top', paddingTop: '8px' }}>
        <button className="delete-btn" onClick={() => deletePath(path.id)}>
          ✕
        </button>
      </td>
    </tr>
  )
}

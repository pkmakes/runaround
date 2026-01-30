import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PathRow as PathRowType } from '../state/store'
import { useStore } from '../state/store'
import { manhattanLength } from '../lib/geometry'

type Props = {
  path: PathRowType
  index: number
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
        <input
          type="text"
          className="table-input"
          value={path.fields.description}
          onChange={(e) =>
            updatePathFields(path.id, { description: e.target.value })
          }
          placeholder="Beschreibung..."
        />
      </td>
      <td>
        <input
          type="text"
          className="table-input"
          value={path.fields.knackpunkt}
          onChange={(e) =>
            updatePathFields(path.id, { knackpunkt: e.target.value })
          }
          placeholder="Knackpunkt..."
        />
      </td>
      <td>
        <input
          type="text"
          className="table-input"
          value={path.fields.begruendung}
          onChange={(e) =>
            updatePathFields(path.id, { begruendung: e.target.value })
          }
          placeholder="Begründung..."
        />
      </td>
      <td>
        <input
          type="text"
          className="table-input"
          value={path.fields.kommentar}
          onChange={(e) =>
            updatePathFields(path.id, { kommentar: e.target.value })
          }
          placeholder="Kommentar..."
        />
      </td>
      <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>
        {distance}px
      </td>
      <td>
        <button className="delete-btn" onClick={() => deletePath(path.id)}>
          ✕
        </button>
      </td>
    </tr>
  )
}


import { DndContext, closestCenter } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useOrderedPaths } from '../state/selectors'
import { useStore } from '../state/store'
import { PathRow } from './PathRow'

export function PathsTable() {
  const orderedPaths = useOrderedPaths()
  const reorderPaths = useStore((s) => s.reorderPaths)
  const pathOrder = useStore((s) => s.pathOrder)
  const addEmptyPathRow = useStore((s) => s.addEmptyPathRow)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pathOrder.indexOf(active.id as string)
    const newIndex = pathOrder.indexOf(over.id as string)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = [...pathOrder]
      newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, active.id as string)
      reorderPaths(newOrder)
    }
  }

  if (orderedPaths.length === 0) {
    return (
      <div className="paths-table-container">
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-alt)' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laufwege</span>
          <button
            className="mode-btn"
            onClick={addEmptyPathRow}
            style={{ padding: '4px 10px', fontSize: '11px' }}
            title="Leere Zeile hinzufügen"
          >
            + Leere Zeile
          </button>
        </div>
        <div style={{ padding: '20px', textAlign: 'center', color: '#a0a0a0' }}>
          Keine Laufwege vorhanden. Wechsle in den Modus "Laufweg erstellen" und klicke auf zwei Dockpoints.
        </div>
      </div>
    )
  }

  return (
    <div className="paths-table-container">
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-alt)' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Laufwege</span>
        <button
          className="mode-btn"
          onClick={addEmptyPathRow}
          style={{ padding: '4px 10px', fontSize: '11px' }}
          title="Leere Zeile hinzufügen"
        >
          + Leere Zeile
        </button>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className="paths-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ width: '50px' }}>Nr.</th>
              <th>Beschreibung</th>
              <th>Knackpunkt</th>
              <th>Begründung</th>
              <th>Kommentar</th>
              <th style={{ width: '80px' }}>Distanz</th>
              <th style={{ width: '60px' }}></th>
            </tr>
          </thead>
          <tbody>
            <SortableContext items={pathOrder} strategy={verticalListSortingStrategy}>
              {orderedPaths.map((path, index) => (
                <PathRow key={path.id} path={path} index={index} />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </DndContext>
    </div>
  )
}


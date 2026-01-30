import { StageView } from '../../canvas/StageView'
import { PathsTable } from '../../table/PathsTable'

export function MainCanvas() {
  return (
    <main className="main-area">
      <div className="canvas-container">
        <StageView />
      </div>
      <PathsTable />
    </main>
  )
}


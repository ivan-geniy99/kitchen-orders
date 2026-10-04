import { useDroppable } from '@dnd-kit/core'
import { columnDroppableId } from '../lib/dnd.js'
import DraggableOrderCard from './DraggableOrderCard.jsx'
import './BoardColumn.css'

export default function BoardColumn({ status, orders, isDropTarget, isDragActive, onOpenOrder }) {
  // Весь вертикальный столбец — зона сброса, включая шапку и пустую
  // область (AC-14).
  const { setNodeRef } = useDroppable({ id: columnDroppableId(status.id) })

  const className = [
    'column',
    isDropTarget ? 'column--drop-target' : '',
    isDragActive && !isDropTarget ? 'column--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section ref={setNodeRef} className={className} aria-label={status.title}>
      <header className="column__header">
        <h2 className="column__title">{status.title}</h2>
        <span className="column__count">{orders.length}</span>
      </header>

      <div className="column__body">
        {orders.length === 0 ? (
          <p className="column__empty">Нет заказов</p>
        ) : (
          orders.map((order) => (
            <DraggableOrderCard key={order.id} order={order} onOpen={onOpenOrder} />
          ))
        )}
      </div>
    </section>
  )
}

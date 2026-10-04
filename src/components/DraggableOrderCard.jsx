import { useDraggable, useDroppable } from '@dnd-kit/core'
import { useEffect, useRef } from 'react'
import { DONE_STATUS } from '../lib/constants.js'
import { cardDroppableId } from '../lib/dnd.js'
import OrderCard from './OrderCard.jsx'

const DRAG_CLICK_GUARD_MS = 250

export default function DraggableOrderCard({ order, onOpen }) {
  // AC-62: в «Сделано» карточка не берётся и не сбрасывается — возврат
  // возможен только кнопкой в карточке заказа.
  const locked = order.status === DONE_STATUS

  const { attributes, isDragging, listeners, setNodeRef: setDragRef } = useDraggable({
    id: order.id,
    disabled: locked,
  })
  const { setNodeRef: setDropRef } = useDroppable({ id: cardDroppableId(order.id) })

  // Клик, случившийся сразу после перетаскивания, не должен открывать карточку.
  const wasDragging = useRef(false)
  const dragEndedAt = useRef(0)

  useEffect(() => {
    if (wasDragging.current && !isDragging) dragEndedAt.current = Date.now()
    wasDragging.current = isDragging
  }, [isDragging])

  function setNodeRef(node) {
    setDragRef(node)
    setDropRef(node)
  }

  function handleClick() {
    if (Date.now() - dragEndedAt.current < DRAG_CLICK_GUARD_MS) return
    onOpen(order)
  }

  // Слушатели dnd-kit навешиваются до onKeyDown, иначе они перекрывают
  // открытие карточки по Enter.
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen(order)
    }
  }

  const className = isDragging
    ? 'card-holder card-holder--dragging'
    : locked
      ? 'card-holder card-holder--static'
      : 'card-holder'

  // В «Сделано» карточка остаётся обычной кнопкой: атрибуты перетаскивания
  // не выставляем, иначе она выглядит для скринридера как отключённая.
  const dragProps = locked ? {} : { ...attributes, ...listeners }

  return (
    <div
      {...dragProps}
      ref={setNodeRef}
      className={className}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <OrderCard order={order} />
    </div>
  )
}

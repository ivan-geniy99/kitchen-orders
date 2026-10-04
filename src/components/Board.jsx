import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useCallback, useMemo, useState } from 'react'
import { STATUSES } from '../lib/constants.js'
import { CARD_PREFIX, COLUMN_PREFIX } from '../lib/dnd.js'
import BoardColumn from './BoardColumn.jsx'
import OrderCard from './OrderCard.jsx'
import './Board.css'

function statusFromDroppable(overId, orders) {
  if (typeof overId !== 'string') return null

  if (overId.startsWith(COLUMN_PREFIX)) {
    const statusId = overId.slice(COLUMN_PREFIX.length)
    return STATUSES.some((status) => status.id === statusId) ? statusId : null
  }

  if (overId.startsWith(CARD_PREFIX)) {
    const orderId = overId.slice(CARD_PREFIX.length)
    const order = orders.find((item) => item.id === orderId)
    return order ? order.status : null
  }

  return null
}

export default function Board({ orders, onOpenOrder, onRequestMove }) {
  const [activeId, setActiveId] = useState(null)
  const [overStatusId, setOverStatusId] = useState(null)

  const sensors = useSensors(
    // Мышь: порог в несколько пикселей, чтобы клик по карточке не был drag'ом.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Тач: старт только после долгого нажатия, иначе перенос нельзя совместить
    // с прокруткой доски (допущение №3 спецификации).
    useSensor(TouchSensor, { activationConstraint: { delay: { tolerance: 8 }, duration: 180 } }),
    useSensor(KeyboardSensor),
  )

  // Курсор и палец дают точный попадак, клавиатура — ближайший угол.
  const collisionDetection = useCallback(
    (args) => (args.pointerCoordinates ? pointerWithin(args) : closestCorners(args)),
    [],
  )

  const grouped = useMemo(() => {
    const byStatus = new Map(STATUSES.map((status) => [status.id, []]))
    for (const order of orders) {
      const bucket = byStatus.get(order.status)
      if (bucket) bucket.push(order)
    }
    return byStatus
  }, [orders])

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeId) ?? null,
    [orders, activeId],
  )

  function handleDragOver(event) {
    setOverStatusId(statusFromDroppable(event.over?.id, orders))
  }

  function reset() {
    setActiveId(null)
    setOverStatusId(null)
  }

  function handleDragEnd(event) {
    const draggedId = event.active?.id
    const targetStatus = statusFromDroppable(event.over?.id, orders)
    reset()

    // Сброс вне колонки и drop в ту же колонку не меняют статус (AC-15).
    if (!draggedId || !targetStatus) return
    const dragged = orders.find((order) => order.id === draggedId)
    if (!dragged || dragged.status === targetStatus) return

    // Правила перехода одинаковы для drag&drop и для селекта статуса (BR-6).
    onRequestMove(draggedId, targetStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={(event) => setActiveId(event.active.id)}
      onDragOver={handleDragOver}
      onDragCancel={reset}
      onDragEnd={handleDragEnd}
    >
      <div className="board">
        {STATUSES.map((status) => (
          <BoardColumn
            key={status.id}
            status={status}
            orders={grouped.get(status.id) ?? []}
            isDropTarget={overStatusId === status.id}
            isDragActive={Boolean(activeOrder)}
            onOpenOrder={onOpenOrder}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOrder ? <OrderCard order={activeOrder} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}

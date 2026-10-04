import { useMemo, useState } from 'react'
import Board from './components/Board.jsx'
import FiltersBar from './components/FiltersBar.jsx'
import OrderDialog from './components/OrderDialog.jsx'
import TransitionDialog from './components/TransitionDialog.jsx'
import { useOrders } from './hooks/useOrders.js'
import { ALL_FILTER } from './lib/constants.js'
import {
  TRANSITION_DIRECT,
  TRANSITION_NONE,
  TRANSITION_RETURN,
  defaultReturnTarget,
  planTransition,
} from './lib/transitions.js'
import './App.css'

export default function App() {
  const { orders, assignees, addOrder, updateOrder, moveOrder, addComment } = useOrders()

  const [assignee, setAssignee] = useState(ALL_FILTER)
  const [withoutAssignee, setWithoutAssignee] = useState(false)
  const [type, setType] = useState(ALL_FILTER)
  const [dialog, setDialog] = useState(null)
  // Окно подтверждения перехода: { orderId, toStatus, kind }.
  const [transition, setTransition] = useState(null)

  // Храним только идентификатор: заказ берём из актуального состояния,
  // иначе открытая карточка показывала бы устаревший снимок после переноса.
  const dialogOrder = useMemo(() => {
    if (!dialog || dialog.mode !== 'edit') return null
    return orders.find((order) => order.id === dialog.orderId) ?? null
  }, [dialog, orders])

  const transitionOrder = useMemo(() => {
    if (!transition) return null
    return orders.find((order) => order.id === transition.orderId) ?? null
  }, [transition, orders])

  const visibleOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (withoutAssignee) {
          if (order.assignee.trim() !== '') return false
        } else if (assignee !== ALL_FILTER && order.assignee !== assignee) {
          return false
        }

        if (type !== ALL_FILTER && order.type !== type) return false

        return true
      }),
    [orders, assignee, withoutAssignee, type],
  )

  const hasActiveFilters =
    withoutAssignee || assignee !== ALL_FILTER || type !== ALL_FILTER

  // Переключатель «Без ответственного» взаимоисключающ с выбором
  // сотрудника: включая его, сбрасываем выбранного сотрудника (AC-24).
  function toggleWithoutAssignee() {
    if (withoutAssignee) {
      setWithoutAssignee(false)
      return
    }
    setAssignee(ALL_FILTER)
    setWithoutAssignee(true)
  }

  function resetFilters() {
    setAssignee(ALL_FILTER)
    setWithoutAssignee(false)
    setType(ALL_FILTER)
  }

  function handleCreate(values) {
    addOrder(values)
    setDialog(null)
  }

  function handleUpdate(id, values) {
    updateOrder(id, values)
    setDialog(null)
  }

  // Общий вход для селекта статуса в карточке и для drag&drop: прямой
  // переход выполняется сразу, остальные требуют подтверждения (BR-1…BR-5).
  function handleRequestMove(orderId, toStatus) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) return

    const kind = planTransition(order, toStatus)
    if (kind === TRANSITION_NONE) return
    if (kind === TRANSITION_DIRECT) {
      moveOrder(orderId, { status: toStatus })
      return
    }

    setTransition({ orderId, toStatus, kind })
  }

  function handleReturnToWork(orderId) {
    setTransition({ orderId, toStatus: defaultReturnTarget(), kind: TRANSITION_RETURN })
  }

  function handleConfirmTransition(change) {
    if (transition) moveOrder(transition.orderId, change)
    setTransition(null)
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1 className="app__title">Заказы кухонного производства</h1>
          <p className="app__subtitle">
            Перетащите карточку в соседнюю колонку или смените статус в карточке заказа.
          </p>
        </div>
        <div className="app__actions">
          <span className="app__counter">
            Заказов: {visibleOrders.length}
            {hasActiveFilters ? ` из ${orders.length}` : ''}
          </span>
          <button
            type="button"
            className="button button--primary"
            onClick={() => setDialog({ mode: 'create', orderId: null })}
          >
            Новый заказ
          </button>
        </div>
      </header>

      <FiltersBar
        assignees={assignees}
        assignee={assignee}
        withoutAssignee={withoutAssignee}
        type={type}
        hasActiveFilters={hasActiveFilters}
        onAssigneeChange={setAssignee}
        onWithoutAssigneeToggle={toggleWithoutAssignee}
        onTypeChange={setType}
        onReset={resetFilters}
      />

      {orders.length === 0 ? (
        <p className="app__hint">Заказов пока нет. Создайте первый заказ.</p>
      ) : hasActiveFilters && visibleOrders.length === 0 ? (
        <p className="app__hint">
          По выбранным фильтрам заказы не найдены. Измените фильтры или сбросьте их.
        </p>
      ) : null}

      <Board
        orders={visibleOrders}
        onOpenOrder={(order) => setDialog({ mode: 'edit', orderId: order.id })}
        onRequestMove={handleRequestMove}
      />

      {dialog ? (
        <OrderDialog
          order={dialogOrder}
          onClose={() => setDialog(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onRequestMove={handleRequestMove}
          onReturnToWork={handleReturnToWork}
          onAddComment={addComment}
        />
      ) : null}

      {transition && transitionOrder ? (
        <TransitionDialog
          order={transitionOrder}
          kind={transition.kind}
          toStatus={transition.toStatus}
          onClose={() => setTransition(null)}
          onConfirm={handleConfirmTransition}
        />
      ) : null}
    </div>
  )
}

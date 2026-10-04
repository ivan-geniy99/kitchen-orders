import { DONE_STATUS, FIELD_LABELS, ORDER_TYPES } from '../lib/constants.js'
import { formatAmount, formatDate, isOverdue, orderTitle, titleOf, todayIso } from '../lib/format.js'
import './OrderCard.css'

const EMPTY = '—'

// Миниатюра на доске: номер, название, заказчик, ответственный, сумма,
// плановая дата и бейдж типа. Фактическая дата — только в «Сделано»
// (AC-30, AC-54…AC-56). Следующий шаг, причина задержки, описание
// и комментарии на карточке не выводятся.
export default function OrderCard({ order, isOverlay = false }) {
  const overdue = isOverdue(order, todayIso())
  const showActualDate = order.status === DONE_STATUS

  const className = [
    'card',
    overdue ? 'card--overdue' : '',
    isOverlay ? 'card--overlay' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={className} aria-label={`Заказ ${order.number}: ${orderTitle(order)}`}>
      <div className="card__top">
        <span className="card__number">{order.number}</span>
        <span className={`card__type card__type--${order.type}`}>
          {titleOf(ORDER_TYPES, order.type, EMPTY)}
        </span>
      </div>

      <p className="card__title">{orderTitle(order)}</p>
      <p className="card__client">
        <span className="card__client-label">{FIELD_LABELS.client}:</span> {order.client || EMPTY}
      </p>

      {overdue ? <p className="card__overdue">Просрочен</p> : null}

      <dl className="card__fields">
        <div className="card__field">
          <dt>{FIELD_LABELS.assignee}</dt>
          <dd>{order.assignee || EMPTY}</dd>
        </div>
        <div className="card__field">
          <dt>{FIELD_LABELS.plannedDate}</dt>
          <dd>{formatDate(order.plannedDate) || EMPTY}</dd>
        </div>
        <div className="card__field">
          <dt>{FIELD_LABELS.amount}</dt>
          <dd>{formatAmount(order.amount)} ₽</dd>
        </div>
        {showActualDate ? (
          <div className="card__field card__field--wide">
            <dt>{FIELD_LABELS.actualDate}</dt>
            <dd>{formatDate(order.actualDate) || EMPTY}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  )
}

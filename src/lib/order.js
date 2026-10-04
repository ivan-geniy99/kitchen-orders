import { DONE_STATUS, INITIAL_STATUS } from './constants.js'
import { createId, formatOrderNumber, todayIso } from './format.js'

export function buildOrder(number, values) {
  return {
    id: createId(),
    number: formatOrderNumber(number),
    title: values.title.trim(),
    client: values.client.trim(),
    type: values.type,
    assignee: values.assignee.trim(),
    status: INITIAL_STATUS,
    plannedDate: values.plannedDate,
    actualDate: '',
    description: values.description.trim(),
    amount: Number(values.amount),
    comments: [],
    createdAt: new Date().toISOString(),
  }
}

export function applyValues(order, values) {
  return {
    ...order,
    title: values.title.trim(),
    client: values.client.trim(),
    type: values.type,
    assignee: values.assignee.trim(),
    plannedDate: values.plannedDate,
    description: values.description.trim(),
    amount: Number(values.amount),
  }
}

// Фактическая дата ставится только при входе в «Сделано», а при возврате
// в активный статус сохраняется (AC-11, AC-13, Q6).
function withStatus(order, status, today) {
  if (order.status === status) return order
  return { ...order, status, actualDate: status === DONE_STATUS ? today : order.actualDate }
}

export function buildComment(order, text) {
  return {
    id: createId(),
    orderId: order.id,
    // Автор — текущий ответственный на момент добавления (AC-50).
    author: order.assignee.trim(),
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
}

// Комментарий добавляется до смены статуса (BR-8, BR-9).
export function transitionOrder(order, { status, assignee, comment }, today = todayIso()) {
  let next = order

  if (typeof assignee === 'string' && assignee.trim()) {
    next = { ...next, assignee: assignee.trim() }
  }

  if (typeof comment === 'string' && comment.trim()) {
    next = { ...next, comments: [...next.comments, buildComment(next, comment)] }
  }

  if (typeof status === 'string') {
    next = withStatus(next, status, today)
  }

  return next
}

export function appendComment(order, text) {
  return { ...order, comments: [...order.comments, buildComment(order, text)] }
}

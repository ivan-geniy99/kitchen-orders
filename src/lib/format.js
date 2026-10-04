import {
  DONE_STATUS,
  MISSING_TITLE,
  ORDER_NUMBER_PAD,
  ORDER_NUMBER_PREFIX,
} from './constants.js'

const amountFormatter = new Intl.NumberFormat('ru-RU')

// Записи версии 1 остаются без названия: в интерфейсе показываем заглушку,
// а в форме редактирования поле пустое и обязательное (AC-66, D-5).
export function orderTitle(order) {
  return order.title.trim() || MISSING_TITLE
}

export function formatOrderNumber(value) {
  return `${ORDER_NUMBER_PREFIX}${String(value).padStart(ORDER_NUMBER_PAD, '0')}`
}

export function formatAmount(value) {
  // Пустое значение — это «нет данных», а не ноль (AC-30).
  // Разделитель разрядов ru-RU — неразрывный пробел, это ожидаемо.
  if (value === '' || value === null || value === undefined) return ''
  const amount = Number(value)
  if (!Number.isFinite(amount)) return ''
  return amountFormatter.format(amount)
}

export function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso() {
  return toIsoDate(new Date())
}

export function formatDate(iso) {
  if (typeof iso !== 'string') return ''
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return ''
  return `${day}.${month}.${year}`
}

// Комментарии показываются с датой и временем: старые сверху (AC-48).
export function formatDateTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  return `${formatDate(toIsoDate(date))} ${time}`
}

export function isOverdue(order, today) {
  if (order.status === DONE_STATUS) return false
  if (!order.plannedDate) return false
  return order.plannedDate < today
}

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function titleOf(list, id, fallback = '') {
  const found = list.find((item) => item.id === id)
  return found ? found.title : fallback
}

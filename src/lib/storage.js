import {
  DEFAULT_TYPE,
  INITIAL_STATUS,
  ORDER_NUMBER_PREFIX,
  STORAGE_KEY,
  STORAGE_VERSION,
} from './constants.js'
import { createId } from './format.js'

const EMPTY_STATE = { orders: [], nextNumber: 1 }

function numberFromId(orderNumber) {
  const digits = String(orderNumber ?? '').replace(ORDER_NUMBER_PREFIX, '')
  const parsed = Number.parseInt(digits, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function normalizeComment(raw, orderId) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.text !== 'string' || !raw.text.trim()) return null

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    orderId: typeof raw.orderId === 'string' && raw.orderId ? raw.orderId : orderId,
    author: typeof raw.author === 'string' ? raw.author : '',
    text: raw.text,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
  }
}

// Записи версии 1 не содержали названия, описания и комментариев (AC-65).
// Хранилище не сбрасывается: недостающие поля становятся пустыми.
function normalizeOrder(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.id !== 'string' || !raw.id) return null
  if (typeof raw.number !== 'string' || !raw.number) return null

  const comments = Array.isArray(raw.comments)
    ? raw.comments.map((comment) => normalizeComment(comment, raw.id)).filter(Boolean)
    : []

  return {
    id: raw.id,
    number: raw.number,
    title: typeof raw.title === 'string' ? raw.title : '',
    client: typeof raw.client === 'string' ? raw.client : '',
    type: typeof raw.type === 'string' ? raw.type : DEFAULT_TYPE,
    assignee: typeof raw.assignee === 'string' ? raw.assignee : '',
    status: typeof raw.status === 'string' ? raw.status : INITIAL_STATUS,
    plannedDate: typeof raw.plannedDate === 'string' ? raw.plannedDate : '',
    actualDate: typeof raw.actualDate === 'string' ? raw.actualDate : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    amount: Number.isFinite(Number(raw.amount)) ? Number(raw.amount) : 0,
    comments,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
  }
}

export function emptyState() {
  return EMPTY_STATE
}

export function loadState() {
  let raw = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return EMPTY_STATE
  }
  if (!raw) return EMPTY_STATE

  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return EMPTY_STATE
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.orders)) {
    return EMPTY_STATE
  }

  const orders = parsed.orders.map(normalizeOrder).filter(Boolean)
  const highest = orders.reduce((max, order) => {
    const value = numberFromId(order.number)
    return value && value > max ? value : max
  }, 0)
  const stored = Number.isFinite(Number(parsed.nextNumber)) ? Number(parsed.nextNumber) : 1

  return { orders, nextNumber: Math.max(stored, highest + 1, 1) }
}

export function saveState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, orders: state.orders, nextNumber: state.nextNumber }),
    )
  } catch {
    // Недоступное или переполненное хранилище не должно ронять приложение.
  }
}

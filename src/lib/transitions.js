import { DONE_STATUS, INITIAL_STATUS, STATUSES } from './constants.js'

// Индекс статуса в справчнике: влево — меньше, то есть возврат назад.
export function statusIndex(statusId) {
  return STATUSES.findIndex((status) => status.id === statusId)
}

export function isBackwardMove(fromStatus, toStatus) {
  const from = statusIndex(fromStatus)
  const to = statusIndex(toStatus)
  if (from < 0 || to < 0) return false
  return to < from
}

export function isDone(statusId) {
  return statusId === DONE_STATUS
}

export function returnTargets() {
  const doneIndex = statusIndex(DONE_STATUS)
  return STATUSES.filter((status) => statusIndex(status.id) < doneIndex)
}

export function defaultReturnTarget() {
  const targets = returnTargets()
  return targets.length > 0 ? targets[targets.length - 1].id : INITIAL_STATUS
}

export const TRANSITION_DIRECT = 'direct'
export const TRANSITION_ASSIGNEE = 'assignee'
export const TRANSITION_COMMENT = 'comment'
export const TRANSITION_ASSIGNEE_AND_COMMENT = 'assigneeAndComment'
export const TRANSITION_RETURN = 'return'
export const TRANSITION_NONE = 'none'

/**
 * Вид подтверждения перехода по матрице раздела 5.1 требований версии 2.
 * kind === TRANSITION_NONE — переход не требует подтверждения и выполняется сразу.
 */
export function planTransition(order, toStatus) {
  if (!order || order.status === toStatus) return TRANSITION_NONE
  if (isDone(order.status)) return TRANSITION_NONE

  const needsAssignee = order.status === INITIAL_STATUS && order.assignee.trim() === ''
  const needsComment = isBackwardMove(order.status, toStatus) || toStatus === DONE_STATUS

  if (needsAssignee && needsComment) return TRANSITION_ASSIGNEE_AND_COMMENT
  if (needsAssignee) return TRANSITION_ASSIGNEE
  if (needsComment) return TRANSITION_COMMENT
  return TRANSITION_DIRECT
}

export const TRANSITION_LABELS = {
  [TRANSITION_ASSIGNEE]: {
    title: 'Нужен ответственный',
    button: 'Назначить и поменять статус',
    intro: 'Нельзя вывести заказ из статуса «Новая», пока не назначен ответственный.',
  },
  [TRANSITION_COMMENT]: {
    title: 'Комментарий к смене статуса',
    button: 'Поменять статус',
    intro: 'При смене статуса нужен комментарий — он попадёт в историю заказа.',
  },
  [TRANSITION_ASSIGNEE_AND_COMMENT]: {
    title: 'Ответственный и комментарий',
    button: 'Поменять статус',
    intro:
      'Заказ уходит из статуса «Новая»: нужен ответственный и комментарий к переходу в «Сделано».',
  },
  [TRANSITION_RETURN]: {
    title: 'Вернуть в работу',
    button: 'Вернуть в работу',
    intro: 'Выберите статус, в который вернуть заказ, и объясните причину комментарием.',
  },
}

export const TRANSITION_DIALOG_CONFIG = {
  [TRANSITION_ASSIGNEE]: { assignee: true, comment: false, status: false },
  [TRANSITION_COMMENT]: { assignee: false, comment: true, status: false },
  [TRANSITION_ASSIGNEE_AND_COMMENT]: { assignee: true, comment: true, status: false },
  [TRANSITION_RETURN]: { assignee: false, comment: true, status: true },
}

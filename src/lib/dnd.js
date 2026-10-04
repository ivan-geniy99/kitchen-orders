export const COLUMN_PREFIX = 'column:'
export const CARD_PREFIX = 'card:'

export function columnDroppableId(statusId) {
  return `${COLUMN_PREFIX}${statusId}`
}

export function cardDroppableId(orderId) {
  return `${CARD_PREFIX}${orderId}`
}

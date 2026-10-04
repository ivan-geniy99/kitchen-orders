import { DONE_STATUS, INITIAL_STATUS } from './constants.js'

// Матрица редактирования раздела 4.4: «Сделано» закрыто целиком,
// описание редактируется только в «Новая», название — до «Сделано».
export function isEditingAllowed(status) {
  return status !== DONE_STATUS
}

export function isFieldEditable(status, field) {
  if (!isEditingAllowed(status)) return false
  if (field === 'description') return status === INITIAL_STATUS
  return true
}

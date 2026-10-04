export const STORAGE_KEY = 'kitchen-orders:state'
export const STORAGE_VERSION = 2

export const ORDER_NUMBER_PREFIX = 'З-'
export const ORDER_NUMBER_PAD = 4

export const ALL_FILTER = 'all'

export const STATUSES = [
  { id: 'new', title: 'Новая' },
  { id: 'measure', title: 'Замерщик' },
  { id: 'design', title: 'Дизайн' },
  { id: 'production', title: 'Производство' },
  { id: 'install', title: 'Монтаж' },
  { id: 'done', title: 'Сделано' },
]

export const INITIAL_STATUS = 'new'
export const DONE_STATUS = 'done'

export const ORDER_TYPES = [
  { id: 'regular', title: 'Обычный' },
  { id: 'complaint', title: 'Рекламация' },
]

export const DEFAULT_TYPE = 'regular'

export const TITLE_MAX_LENGTH = 100
export const DESCRIPTION_MAX_LENGTH = 1000

// Записи версии 1 не имели названия: показываем заглушку, но в форме
// редактирования поле остаётся пустым и обязательным (AC-66, D-5).
export const MISSING_TITLE = 'Без названия'

export const FIELD_LABELS = {
  number: 'Номер заказа',
  title: 'Название',
  client: 'Заказчик',
  type: 'Тип заказа',
  assignee: 'Ответственный',
  status: 'Текущий статус',
  plannedDate: 'Плановая дата',
  actualDate: 'Фактическая дата',
  description: 'Описание',
  amount: 'Сумма заказа',
  comment: 'Комментарий',
  comments: 'Комментарии',
}

export const EMPTY_ORDER = {
  title: '',
  client: '',
  type: DEFAULT_TYPE,
  assignee: '',
  plannedDate: '',
  description: '',
  amount: '',
}

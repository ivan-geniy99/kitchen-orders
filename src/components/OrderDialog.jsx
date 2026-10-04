import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DESCRIPTION_MAX_LENGTH,
  DONE_STATUS,
  EMPTY_ORDER,
  FIELD_LABELS,
  INITIAL_STATUS,
  ORDER_TYPES,
  STATUSES,
  TITLE_MAX_LENGTH,
} from '../lib/constants.js'
import { formatDate, formatDateTime, titleOf } from '../lib/format.js'
import { isFieldEditable } from '../lib/permissions.js'
import './OrderDialog.css'

const EMPTY = '—'

function valuesFromOrder(order) {
  if (!order) return EMPTY_ORDER
  return {
    title: order.title,
    client: order.client,
    type: order.type,
    assignee: order.assignee,
    plannedDate: order.plannedDate,
    description: order.description,
    amount: String(order.amount),
  }
}

function validate(values) {
  const errors = {}

  if (!values.title.trim()) errors.title = 'Укажите название'
  else if (values.title.trim().length > TITLE_MAX_LENGTH) {
    errors.title = `Не более ${TITLE_MAX_LENGTH} символов`
  }

  if (!values.client.trim()) errors.client = 'Укажите заказчика'

  if (!values.plannedDate) errors.plannedDate = 'Укажите плановую дату'

  if (!String(values.amount).trim()) {
    errors.amount = 'Укажите сумму заказа'
  } else {
    const amount = Number(values.amount)
    if (!Number.isFinite(amount)) errors.amount = 'Сумма должна быть числом'
    else if (amount < 0) errors.amount = 'Сумма не может быть отрицательной'
  }

  if (values.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Не более ${DESCRIPTION_MAX_LENGTH} символов`
  }

  return errors
}

export default function OrderDialog({
  order,
  onClose,
  onCreate,
  onUpdate,
  onRequestMove,
  onReturnToWork,
  onAddComment,
}) {
  const isCreate = order === null
  const [values, setValues] = useState(() => valuesFromOrder(order))
  const [errors, setErrors] = useState({})
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const dialogRef = useRef(null)

  const status = isCreate ? null : order.status
  const isDone = status === DONE_STATUS
  const isEditable = isCreate || !isDone
  const canEdit = (field) => isCreate || isFieldEditable(status, field)

  // Комментарии хранятся в заказе; показываем от новых к старым.
  const comments = useMemo(
    () => (order ? [...order.comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []),
    [order],
  )
  const canComment = Boolean(order && order.assignee.trim())

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    dialogRef.current?.querySelector('input, select, textarea')?.focus()
  }, [])

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const found = validate(values)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    if (isCreate) onCreate(values)
    else onUpdate(order.id, values)
  }

  function handleCommentSubmit() {
    if (!comment.trim()) {
      setCommentError('Введите комментарий')
      return
    }
    onAddComment(order.id, comment)
    setComment('')
    setCommentError('')
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={isCreate ? 'Новый заказ' : `Заказ ${order.number}`}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 className="dialog__title">
            {isCreate ? 'Новый заказ' : `Заказ ${order.number}`}
          </h2>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        {isCreate ? (
          <p className="dialog__note">
            {FIELD_LABELS.number}: будет присвоен автоматически. Заказ создается в статусе «
            {titleOf(STATUSES, INITIAL_STATUS)}».
          </p>
        ) : null}

        {isCreate ? null : isDone ? (
          <div className="dialog__status">
            <div className="dialog__status-row">
              <div className="field">
                <span className="field__label">{FIELD_LABELS.status}</span>
                <span className="dialog__status-value">{titleOf(STATUSES, status)}</span>
              </div>
              <button
                type="button"
                className="button button--primary"
                onClick={() => onReturnToWork(order.id)}
              >
                Вернуть в работу
              </button>
            </div>
            <p className="dialog__hint">
              Заказ выполнен: поля доступны только для чтения, статус меняется только возвратом в
              работу.
            </p>
          </div>
        ) : (
          <div className="dialog__status">
            <label className="field">
              <span className="field__label">{FIELD_LABELS.status}</span>
              <select
                className="field__control"
                value={status}
                onChange={(event) => onRequestMove(order.id, event.target.value)}
              >
                {STATUSES.filter((item) => item.id !== status).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="dialog__hint">
              Переход назад или в «Сделано» потребует комментарий, из «Новая» — ответственного.
              Фактическая дата проставляется автоматически при переходе в «Сделано».
            </p>
          </div>
        )}

        <form className="dialog__form" onSubmit={handleSubmit} noValidate>
          <label className="field field--wide">
            <span className="field__label">
              {FIELD_LABELS.title}
              {isEditable ? <span className="field__optional">— обязательно</span> : null}
            </span>
            <input
              className="field__control"
              value={values.title}
              maxLength={TITLE_MAX_LENGTH}
              readOnly={!canEdit('title')}
              onChange={(event) => setField('title', event.target.value)}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <span className="field__error">{errors.title}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">{FIELD_LABELS.client}</span>
            <input
              className="field__control"
              value={values.client}
              readOnly={!isEditable}
              onChange={(event) => setField('client', event.target.value)}
              aria-invalid={Boolean(errors.client)}
            />
            {errors.client ? <span className="field__error">{errors.client}</span> : null}
          </label>

          <label className="field">
            <span className="field__label">{FIELD_LABELS.type}</span>
            <select
              className="field__control"
              value={values.type}
              disabled={!isEditable}
              onChange={(event) => setField('type', event.target.value)}
            >
              {ORDER_TYPES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field__label">
              {FIELD_LABELS.assignee}{' '}
              <span className="field__optional">— необязательно</span>
            </span>
            <input
              className="field__control"
              value={values.assignee}
              readOnly={!isEditable}
              onChange={(event) => setField('assignee', event.target.value)}
              placeholder="Оставьте пустым, чтобы заказ попал в фильтр «Без ответственного»"
            />
          </label>

          <label className="field">
            <span className="field__label">{FIELD_LABELS.plannedDate}</span>
            <input
              className="field__control"
              type="date"
              value={values.plannedDate}
              readOnly={!isEditable}
              onChange={(event) => setField('plannedDate', event.target.value)}
              aria-invalid={Boolean(errors.plannedDate)}
            />
            {errors.plannedDate ? (
              <span className="field__error">{errors.plannedDate}</span>
            ) : null}
          </label>

          <label className="field">
            <span className="field__label">{FIELD_LABELS.amount}</span>
            <input
              className="field__control"
              type="number"
              min="0"
              step="0.01"
              value={values.amount}
              readOnly={!isEditable}
              onChange={(event) => setField('amount', event.target.value)}
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount ? <span className="field__error">{errors.amount}</span> : null}
          </label>

          <label className="field field--wide">
            <span className="field__label">
              {FIELD_LABELS.description}{' '}
              <span className="field__optional">
                {canEdit('description')
                  ? '— необязательно'
                  : '— доступно для чтения'}
              </span>
            </span>
            <textarea
              className="field__control field__control--area"
              rows="3"
              value={values.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              readOnly={!canEdit('description')}
              onChange={(event) => setField('description', event.target.value)}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description ? (
              <span className="field__error">{errors.description}</span>
            ) : null}
          </label>

          {isCreate ? null : (
            <div className="comments">
              <h3 className="comments__title">
                {FIELD_LABELS.comments}
                {comments.length > 0 ? ` (${comments.length})` : ''}
              </h3>

              {comments.length === 0 ? (
                <p className="comments__empty">Комментариев пока нет.</p>
              ) : (
                <ul className="comments__list">
                  {comments.map((item) => {
                    const stamp = formatDateTime(item.createdAt)
                    return (
                      <li key={item.id} className="comment">
                        <p className="comment__meta">
                          <span className="comment__author">{item.author || EMPTY}</span>
                          {stamp ? ` · ${stamp}` : ''}
                        </p>
                        <p className="comment__text">{item.text}</p>
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="comments__form">
                <label className="field">
                  <span className="field__label">{FIELD_LABELS.comment}</span>
                  <textarea
                    className="field__control field__control--area"
                    rows="2"
                    value={comment}
                    readOnly={!canComment}
                    onChange={(event) => {
                      setComment(event.target.value)
                      if (commentError) setCommentError('')
                    }}
                    aria-invalid={Boolean(commentError)}
                  />
                  {commentError ? <span className="field__error">{commentError}</span> : null}
                </label>

                {canComment ? (
                  <div className="comments__actions">
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={handleCommentSubmit}
                    >
                      Добавить комментарий
                    </button>
                  </div>
                ) : (
                  <p className="comments__hint">
                    Комментарии добавляет ответственный: назначьте его, чтобы вести историю заказа.
                  </p>
                )}
              </div>
            </div>
          )}

          {isEditable ? (
            <footer className="dialog__actions">
              <button type="button" className="button button--ghost" onClick={onClose}>
                Отмена
              </button>
              <button type="submit" className="button button--primary">
                {isCreate ? 'Создать заказ' : 'Сохранить'}
              </button>
            </footer>
          ) : (
            <footer className="dialog__actions">
              <button type="button" className="button button--ghost" onClick={onClose}>
                Закрыть
              </button>
            </footer>
          )}
        </form>

        {order && !isCreate && order.actualDate ? (
          <p className="dialog__note">
            {FIELD_LABELS.actualDate}: {formatDate(order.actualDate)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { FIELD_LABELS, STATUSES } from '../lib/constants.js'
import { titleOf } from '../lib/format.js'
import {
  TRANSITION_DIALOG_CONFIG,
  TRANSITION_LABELS,
  TRANSITION_RETURN,
  defaultReturnTarget,
  returnTargets,
} from '../lib/transitions.js'
import './TransitionDialog.css'

// Окно подтверждения смены статуса. Набор полей зависит от вида перехода:
// ответственный (BR-1), обязательный комментарий (BR-2, BR-3, BR-4) или
// оба сразу. Для возврата из «Сделано» добавляется выбор целевого статуса.
export default function TransitionDialog({ order, kind, toStatus, onClose, onConfirm }) {
  const config = TRANSITION_DIALOG_CONFIG[kind]
  const copy = TRANSITION_LABELS[kind]
  const isReturn = kind === TRANSITION_RETURN

  const [status, setStatus] = useState(() => toStatus ?? defaultReturnTarget())
  const [assignee, setAssignee] = useState(order.assignee)
  const [comment, setComment] = useState('')
  const [errors, setErrors] = useState({})
  const dialogRef = useRef(null)

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

  const targetStatus = isReturn ? status : toStatus

  function handleSubmit(event) {
    event.preventDefault()

    const found = {}
    if (config.status && !status) found.status = 'Выберите статус'
    if (config.assignee && !assignee.trim()) found.assignee = 'Укажите ответственного'
    if (config.comment && !comment.trim()) found.comment = 'Введите комментарий'

    if (Object.keys(found).length > 0) {
      setErrors(found)
      return
    }

    onConfirm({
      status: targetStatus,
      assignee: config.assignee ? assignee : undefined,
      comment: config.comment ? comment : '',
    })
  }

  return (
    <div className="overlay overlay--top" onClick={onClose}>
      <div
        className="dialog dialog--narrow"
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 className="dialog__title">{copy.title}</h2>
          <button type="button" className="dialog__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </header>

        <p className="dialog__route">
          Заказ {order.number}: {titleOf(STATUSES, order.status)} →{' '}
          <strong>{titleOf(STATUSES, targetStatus)}</strong>
        </p>
        <p className="dialog__hint">{copy.intro}</p>

        <form className="dialog__form" onSubmit={handleSubmit} noValidate>
          {config.status ? (
            <label className="field field--wide">
              <span className="field__label">{FIELD_LABELS.status}</span>
              <select
                className="field__control"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-invalid={Boolean(errors.status)}
              >
                {returnTargets().map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              {errors.status ? <span className="field__error">{errors.status}</span> : null}
            </label>
          ) : null}

          {config.assignee ? (
            <label className="field field--wide">
              <span className="field__label">{FIELD_LABELS.assignee}</span>
              <input
                className="field__control"
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                aria-invalid={Boolean(errors.assignee)}
              />
              {errors.assignee ? (
                <span className="field__error">{errors.assignee}</span>
              ) : null}
            </label>
          ) : null}

          {config.comment ? (
            <label className="field field--wide">
              <span className="field__label">
                {FIELD_LABELS.comment} <span className="field__optional">— обязательно</span>
              </span>
              <textarea
                className="field__control field__control--area"
                rows="3"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                aria-invalid={Boolean(errors.comment)}
              />
              {errors.comment ? <span className="field__error">{errors.comment}</span> : null}
            </label>
          ) : null}

          <footer className="dialog__actions">
            <button type="button" className="button button--ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="button button--primary">
              {copy.button}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

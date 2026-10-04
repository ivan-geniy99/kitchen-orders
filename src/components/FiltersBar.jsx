import { ALL_FILTER, ORDER_TYPES } from '../lib/constants.js'
import './FiltersBar.css'

export default function FiltersBar({
  assignees,
  assignee,
  withoutAssignee,
  type,
  onAssigneeChange,
  onWithoutAssigneeToggle,
  onTypeChange,
  onReset,
  hasActiveFilters,
}) {
  return (
    <div className="filters">
      <div className="filters__group">
        <label className="filters__label" htmlFor="filter-assignee">
          Ответственный
        </label>
        <select
          id="filter-assignee"
          className="filters__select"
          value={withoutAssignee ? ALL_FILTER : assignee}
          disabled={withoutAssignee}
          onChange={(event) => onAssigneeChange(event.target.value)}
        >
          <option value={ALL_FILTER}>Все</option>
          {assignees.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className={`filters__toggle ${withoutAssignee ? 'filters__toggle--active' : ''}`}
        aria-pressed={withoutAssignee}
        onClick={onWithoutAssigneeToggle}
      >
        Без ответственного
      </button>

      <div className="filters__group">
        <label className="filters__label" htmlFor="filter-type">
          Тип заказа
        </label>
        <select
          id="filter-type"
          className="filters__select"
          value={type}
          onChange={(event) => onTypeChange(event.target.value)}
        >
          <option value={ALL_FILTER}>Все</option>
          {ORDER_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters ? (
        <button type="button" className="filters__reset" onClick={onReset}>
          Сбросить фильтры
        </button>
      ) : null}
    </div>
  )
}

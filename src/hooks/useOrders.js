import { useCallback, useEffect, useMemo, useState } from 'react'
import { appendComment, applyValues, buildOrder, transitionOrder } from '../lib/order.js'
import { loadState, saveState } from '../lib/storage.js'

export function useOrders() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const addOrder = useCallback((values) => {
    setState((prev) => ({
      orders: [buildOrder(prev.nextNumber, values), ...prev.orders],
      nextNumber: prev.nextNumber + 1,
    }))
  }, [])

  const updateOrder = useCallback((id, values) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => (order.id === id ? applyValues(order, values) : order)),
    }))
  }, [])

  // Единая точка смены статуса для селекта в карточке и для drag&drop.
  const moveOrder = useCallback((id, change) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === id ? transitionOrder(order, change) : order,
      ),
    }))
  }, [])

  const addComment = useCallback((id, text) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.map((order) => (order.id === id ? appendComment(order, text) : order)),
    }))
  }, [])

  const assignees = useMemo(() => {
    const names = new Set()
    for (const order of state.orders) {
      const name = order.assignee.trim()
      if (name) names.add(name)
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'ru'))
  }, [state.orders])

  return { orders: state.orders, assignees, addOrder, updateOrder, moveOrder, addComment }
}

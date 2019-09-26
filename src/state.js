import tuple from 'immutable-tuple'
import { createEffect } from './util'

const stateCache = new WeakMap
export default createEffect(
  'state',
  function get(target) {
    let state = stateCache.get(tuple(target))
    if (!state) stateCache.set(tuple(target), state = {})
    return state
  },
  function set(target, obj) {
    let state = stateCache.get(tuple(target))
    if (!state) return false
    for (let prop in obj) {
      state[prop] = obj[prop]
    }
    return true
  })

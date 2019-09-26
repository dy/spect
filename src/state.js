import tuple from 'immutable-tuple'
import { createEffect } from './util'

const stateCache = new WeakMap
export default createEffect(function state(target) {
  let state = stateCache.get(tuple(target))
  if (!state) stateCache.set(tuple(target), state = {})
  return state
})

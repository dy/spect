import tuple from 'immutable-tuple'
import { createEffect } from './util'

const stateCache = new WeakMap
export default createEffect(function prop(el) {
  let state = stateCache.get(tuple(el))
  if (!state) stateCache.set(tuple(el), state = {})
  return state
})

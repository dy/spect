import { createEffect } from './util'

const stateCache = new WeakMap
export default createEffect(function prop(el) {
  let state = stateCache.get(el)
  if (!state) stateCache.set(el, state = {})
  return state
})

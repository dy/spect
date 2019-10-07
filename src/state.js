import tuple from 'immutable-tuple'
import { createEffect } from './util'
import p from 'primitive-pool'

const stateCache = new WeakMap
export default function state (target, ...args) {
  target = p(target)
  return _state(target, ...args)
}

let _state = createEffect(
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

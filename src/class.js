import { createEffect } from './util'

const cache = new WeakMap
export default createEffect(
  'class',
  function get(el) {
    let state = cache.get(el)
    if (!state) cache.set(el, state = {})

    for (let cl of el.classList) {
      state[cl] = true
    }

    return state
  },
  function set(el, obj) {
    let state = cache.get(el)
    if (!state) return false

    for (let prop in obj) {
      let value = obj[prop]
      if (!value) {
          delete state[prop]
          el.classList.remove(prop)
      }
      else {
        state[prop] = true
        el.classList.add(prop, '')
      }
    }
    return true
  }
)


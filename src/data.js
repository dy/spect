import {createEffect} from './util'

const cache = new WeakMap
export default createEffect(
  'data',
  function get(el) {
    let state = cache.get(el)
    if (!state) {
      cache.set(el, state = {})
    }

    for (let attr of el.dataset) state[attr.name] = attr.value
    return state
  },
  function set(el, obj) {
    // let state = cache.get(el)
    // if (!state) return false
    // for (let prop in obj) {
    //   state[prop] = obj[prop]
    //   el.setAttribute(prop, obj[prop])
    // }
    // return true
  }
)

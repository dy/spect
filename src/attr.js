import {createEffect} from './util'
import {publish} from './core'

const cache = new WeakMap
export default createEffect(
  'attr',
  function get (el) {
    let state = cache.get(el)
    if (!state) {
      let observer = new MutationObserver(records => {
        for (let i = 0, length = records.length; i < length; i++) {
          let { target, oldValue, attributeName } = records[i];
          // publish([el, 'attr', attributeName])
        }
      })
      observer.observe(el, { attributes: true })
      cache.set(el, state = { observer, data:{} })
    }

    for (let attr of el.attributes) {
      let value = attr.value
      state.data[attr.name] = attr.value
    }

    return state.data
  },
  function set(el, obj) {
    let state = cache.get(el)
    if (!state) return false
    for (let prop in obj) {
      let value = obj[prop]
      switch(value) {
        case (false):
          delete state.data[prop]
          el.removeAttribute(prop)
          break;
        case (true):
          state.data[prop] = true
          el.setAttribute(prop, '')
          break;
        default:
          state.data[prop] = value
          el.setAttribute(prop, value)
      }
    }

    return true
  }
)


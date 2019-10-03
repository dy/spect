import { createEffect } from './util'

const cache = new WeakMap
function get(el) {
  let state = cache.get(el)

  if (!state) {
    cache.set(el, state = {})

    let observer = new MutationObserver(records => {
      for (let i = 0, length = records.length; i < length; i++) {
        let { target, oldValue, attributeName } = records[i];
        if (attributeName !== 'class') continue
        if (target !== el) continue
        for (let cl of el.classList) {
          if (state[cl]) continue
          state[cl] = true
          publish([el, 'class', cl])
        }
        for (let cl of state) {
          if (!el.classList.contains(cl)) {
            delete state[cl]
            publish([el, 'class', cl])
          }
        }
      }
    })

    observer.observe(el, { attributes: true, childList: false, subtree: false })
    cache.set(el, state = { observer, data: {} })
  }

  for (let cl of el.classList) {
    state[cl] = true
  }

  return state
}

export default createEffect(
  'class',
  get,
  function set(el, obj) {
    let state = get(el)

    for (let prop in obj) {
      let value = obj[prop]
      if (!value) {
          delete state[prop]
          el.classList.remove(prop)
      }
      else {
        state[prop] = true
        el.classList.add(prop)
      }
    }

    return true
  }
)


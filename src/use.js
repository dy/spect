import { run } from './core'
import regularElements from 'regular-elements'
// import { observe } from 'selector-observer'
// import { fire, on } from 'delegated-events'

const selectors = {}
export default function use(selector, fn) {
  // observe(selector, {
  //   initialize(el) {
  //     fire(el, 'init', {selector})
  //   },
  //   add(el) {
  //     fire(el, 'connected', {selector})
  //   },
  //   remove(el) {
  //     fire(el, 'disconnected', {selector})
  //   }
  // })

  if (!selectors[selector]) {
    let set = selectors[selector] = new WeakMap

    regularElements.define(selector, {
      onconnected(e) {
        if (!set.has(this)) {
          let state = {}
          set.set(this, state)
          run(() => {
            let el = e.target
            state.destroy = fn(el)
          })
        }
      },
      ondisconnected(e) {
        let { destroy } = set.get(this)
        if (destroy && destroy.call) destroy()
        set.delete(this)
      }
    })
  }
}

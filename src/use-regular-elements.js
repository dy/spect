// regular-elements based
import { run } from './core'
import regularElements from 'regular-elements'

const selectors = {}
export default function use(selector, fn) {
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

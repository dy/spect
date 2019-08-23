import onload from 'fast-on-load'
import tuple from 'immutable-tuple'
import { commit } from "./src/core"
import { noop } from './src/util';

let tracking = new WeakMap

// mount is post-effect
export default function mount (fn, deps) {
  let fx = commit(this, 'mount', deps)

  if (!fx) return

  this.forEach(el => {
    let key = tuple(el, fx.id)

    let unload
    let handle = [() => unload = fn(), () => unload && unload()]

    tracking.set(key, handle)
    state.onload(el, ...handle)
  })

  fx.destroy = () => {
    this.forEach(el => {
      let key = tuple(el, fx.id)
      let [load, unload] = tracking.get(key)
      onload.destroy(el, load, unload)
    })
  }
}


import delegated from 'delegate-it'
import { registerEffect, queue } from './src/core.js'

const cbCache = new WeakMap

// for easiness of effects that must be a simple function
export default function on(evts, delegate, handler, deps) {
  let els = commit(this, 'on', null, deps)
  if (!els) return

  if (typeof delegate === 'function') {
    deps = handler
    handler = delegate
    delegate = null
  }
  evts = evts.split(/\s+/)

  let destroy = []

  if (delegate) {
    evts.forEach(evt => this.forEach(el => {
      const delegation = delegated(el, delegate, evt, handler)
      destroy.push(delegation.destroy)
    }))
  }
  else {
    evts.forEach(evt => this.forEach(el => {
      el.addEventListener(evt, handler)
      destroy.push(() => el.removeEventListener(evt, handler))
    }))
  }

  // first is called after current effect, second is called on destroy
  return fx.destroy = () => destroy.forEach(fn => fn())
}

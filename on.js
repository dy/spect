import delegated from 'delegate-it'
import { commit, SET } from './src/core.js'

// for easiness of effects that must be a simple function
export default function on(evts, delegate, handler, deps) {
  if (typeof delegate === 'function') {
    deps = handler
    handler = delegate
    delegate = null
  }

  // register effect call
  if (!commit(this, 'on', SET, () => destroy.forEach(fn => fn()), deps)) return

  // attach events
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
}

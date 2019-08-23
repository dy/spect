import delegated from 'delegate-it'
import { commit } from './src/core.js'

// for easiness of effects that must be a simple function
export default function on(evts, delegate, handler, deps) {
  if (typeof delegate === 'function') {
    deps = handler
    handler = delegate
    delegate = null
  }

  // register effect call
  let fx = commit(this, 'on', deps)
  if (!fx) return

  // attach events
  evts = evts.split(/\s+/)

  let destroyList = []

  if (delegate) {
    evts.forEach(evt => this.forEach(el => {
      const delegation = delegated(el, delegate, evt, handler)
      destroyList.push(delegation.destroy)
    }))
  }
  else {
    evts.forEach(evt => this.forEach(el => {
      el.addEventListener(evt, handler)
      destroyList.push(() => el.removeEventListener(evt, handler))
    }))
  }

  fx.destroy = () => {
    destroyList && destroyList.forEach(destroy => destroy())
  }
}

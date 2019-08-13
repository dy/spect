import delegated from 'delegate-it'
import { fxCall } from './core.js'

const cbCache = new WeakMap

// we keep delegate a separate prop for now
// to let it be a set and to let events to have own classes
export default function on (evts, delegate, handler, deps) {
  if (typeof delegate === 'function') {
    deps = handler
    handler = delegate
    delegate = null
  }
  evts = evts.split(/\s+/)

  // FIXME: figure out if we can factor this element out
  let els = this || [document]

  fxCall(this, 'on', ({currentEl, currentAspect}, fxCount) => {
    if (delegate) {
      evts.forEach(evt => els.forEach(el => {
        const delegation = delegated(el, delegate, evt, handler)
      }))
    }
    else {
      evts.forEach(evt => els.forEach(el => {
        el.addEventListener(evt, handler)
      }))
    }
  }, deps)
}

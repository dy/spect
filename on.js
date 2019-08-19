import delegated from 'delegate-it'
import { registerEffect } from './src/core.js'

const cbCache = new WeakMap

export default registerEffect('on', ({onSet}) => {
  // listeners must be added instantly
  // eg. click can be emitted instantly after on call
  onSet((evts, delegate, handler) => {
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
    return { destroy: () => destroy.forEach(fn => fn()) }
  })
})

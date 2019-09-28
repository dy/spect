// import delegate from 'delegate-it'
import * as delegate from 'delegated-events'
import { deps } from './core'


export default function on (target, evts, fn) {
  deps(undefined, () => destroy.forEach(fn => fn()))

  let destroy = []

  evts = evts.split(/\s+/)

  if (typeof target === 'string') {
    evts.forEach(evt => {
      delegate.on(evt, target, fn)
      destroy.push(() => delegate.off(evt, target, fn))
    })
  }
  else {
    evts.forEach(evt => {
      target.addEventListener(evt, fn)
      destroy.push(() => target.removeEventListener(evt, fn))
    })
  }
}

export function fire(target, evt, o) {
  if (evt instanceof Event) {
    target.dispatchEvent(evt)
  }
  else {
    evt = evt.split(/\s+/)
    evt.forEach(evt => delegate.fire(target, evt, o))
  }

  return this
}

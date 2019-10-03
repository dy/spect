// import delegate from 'delegate-it'
import * as delegate from 'delegated-events'


export default function on (target, evt, fn) {
  return Promise.race(evt.split(/\s+/).map(evt => new Promise(ok => {
    if (typeof target === 'string') {
      delegate.on(evt, target, e => { fn(e); ok() })
    }
    else {
      target.addEventListener(evt, e => { fn(e); ok() })
    }
  })))
}

export function off(target, evts, fn) {
  evts = evts.split(/\s+/)

  if (typeof target === 'string') {
    evts.forEach(evt => {
      delegate.off(evt, target, fn)
    })
  }
  else {
    evts.forEach(evt => {
      target.removeEventListener(evt, fn)
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

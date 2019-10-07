// import delegate from 'delegate-it'
import * as delegate from 'delegated-events'
import tuple from 'immutable-tuple'
import { isElement } from './util'

const cache = new WeakMap()
export default function on (target, evt, fn=()=>{}) {
  let seq = evt.split(/\s*\>\s*/)

  // on(target, 'mousedown > mousemove > mouseup', fn => fn => fn)
  if (seq.length > 1) return onSequence(target, seq, fn)

  let resolve, p, off
  p = new Promise(ok => { resolve = ok })

  // no-fn awaits for event
  if (!fn) fn = (() => off())

  // on(target, 'mousedown touchdown', fn)
  let evts = evt.split(/\s+/)
  if (evts.length > 1) {

    let offs = evts.map(evt => on(target, evt, fn))
    Promise.race(offs).then(e => {
      fn(e)
      resolve(e)
      p = new Promise(ok => { resolve = ok })
      off.then = p.then.bind(p)
    })

    off = () => offs.forEach(off => off())
    off.then = p.then.bind(p)

    return off
  }

  // on(target, 'click', fn)
  let key = tuple(target, evt)
  let listeners = cache.get(key)
  if (!listeners) cache.set(key, listeners = [])
  let cb = e => {
    fn(e)
    resolve(e)
    p = new Promise(ok => { resolve = ok })
    off.then = p.then.bind(p)
  }
  listeners.push(cb)

  if (typeof target === 'string') {
    delegate.on(evt, target, cb)
    off = () => {
      delegate.off(evt, target, cb)
      let idx = listeners.indexOf(cb)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }
  else if (target.addEventListener) {
    target.addEventListener(evt, cb)
    off = () => {
      target.removeEventListener(evt, cb)
      let idx = listeners.indexOf(cb)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }
  // non-dom targets
  // not intended to be used directly, just as common event bus
  else {
    let gatedCb = (e) => {
      if (e.detail.target !== target) return
      cb(e)
    }
    document.addEventListener(evt, gatedCb)
    off = () => {
      document.removeEventListener(evt, gatedCb)
    }
  }

  off.then = p.then.bind(p)
  return off
}

// TODO: that can be a separate module
export function onSequence(target, seq, fn) {
  let currSeq = [], currFn, enabled = true
  let resolve, p
  p = new Promise(ok => { resolve = ok })

  ;(async () => {
    while (enabled) {
      // reset cycle
      if (!currSeq.length) {
        currSeq = [...seq]
        currFn = fn
      }

      let evt = currSeq.shift()
      let off = on(target, evt)
      let e = await off
      off()
      currFn = currFn(e)
      resolve(e)
      p = new Promise(ok => { resolve = ok })
      offSeq.then = p.then.bind(p)
    }
  })()

  function offSeq () {
    enabled = false
    off()
  }
  offSeq.then = p.then.bind(p)
  return offSeq
}


export function fire(target, evt, detail={}) {
  // redirect target
  if (!target.dispatchEvent) {
    detail.target = target
    target = document
  }

  if (evt instanceof Event) {
    target.dispatchEvent(evt)
  }
  else {
    evt.split(/\s+/).forEach(evt => {
      if (target.dispatchEvent) {
        target.dispatchEvent(new CustomEvent(evt, {
          bubbles: true,
          cancelable: true,
          detail
        }))
      }
      else {
        delegate.fire(target, evt, detail)
      }
    })
  }

  return this
}

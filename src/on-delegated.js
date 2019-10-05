// import delegate from 'delegate-it'
import * as delegate from 'delegated-events'
import tuple from 'immutable-tuple'

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
  else {
    target.addEventListener(evt, cb)
    off = () => {
      target.removeEventListener(evt, cb)
      let idx = listeners.indexOf(cb)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }

  off.then = p.then.bind(p)
  return off
}


// export function off(target, evts, fn) {
//   let seq = evts.split(/\s*\>\s*/)
//   if (seq.length > 1) return offSequence(target, seq, fn)

//   let key = tuple(target, evts)

//   evts.split(/\s+/).forEach(evt => {
//     let listeners = cache.get(key)

//     // unbind all
//     if (!fn) {
//       listeners.forEach(fn => off(target, evt, fn))
//       listeners.length = 0
//       return
//     }

//     let idx = listeners.indexOf(fn)
//     if (typeof target === 'string') {
//       delegate.off(evt, target, fn)
//     }
//     else {
//       target.removeEventListener(evt, fn)
//     }
//     if (idx >= 0) listeners.splice(idx, 1)
//   })
// }

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


export function fire(target, evt, o) {
  if (evt instanceof Event) {
    target.dispatchEvent(evt)
  }
  else {
    evt.split(/\s+/).forEach(evt => delegate.fire(target, evt, o))
  }

  return this
}

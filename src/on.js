import delegate from 'delegate-it'

const _deps = Symbol.for('spect.deps')
const _target = Symbol.for('spect.target')

export default function on (evts, delegate, fn, deps) {
  if (typeof delegate === 'function') {
    deps = fn
    fn = delegate
    delegate = null
  }

  if (this[_deps] && !this[_deps](deps, () => destroy.forEach(fn => fn && fn()))) return this

  let destroy = []

  evts = evts.split(/\s+/)

  let el = this[_target] || this

  if (delegate) {
    evts.forEach(evt => {
      const delegation = delegated(el, delegate, evt, fn)
      destroy.push(() => delegation.destroy())
    })
  }
  else {
    evts.forEach(evt => {
      el.addEventListener(evt, fn)
      destroy.push(() => el.removeEventListener(evt, fn))
    })
  }
}



export function emit(evt, o, deps) {
  if (this[_deps] && !this[_deps](deps)) return this

  let el = this[_target] || this

  if (evt instanceof Event) {
    el.dispatchEvent(evt)
  }
  else if (typeof evt === 'string') {
    evt = evt.split(/\s+/)
    evt.forEach(evt => el.dispatchEvent(new CustomEvent(evt)))
  }
  else if (typeof evt === 'object') {
    el.dispatchEvent(new CustomEvent(evt.name, e))
  }

  return this
}

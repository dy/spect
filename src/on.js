

export const on = (evts, delegate, fn, deps) => {
  if (typeof delegate === 'function') {
    deps = fn
    fn = delegate
    delegate = null
  }

  if (!this.deps(deps, () => destroy.forEach(fn => fn && fn()))) return this

  let destroy = []

  evts = evts.split(/\s+/)

  if (delegate) {
    evts.forEach(evt => this.forEach(el => {
      const delegation = delegated(el, delegate, evt, fn)
      destroy.push(() => delegation.destroy())
    }))
  }
  else {
    evts.forEach(evt => this.forEach(el => {
      el.addEventListener(evt, fn)
      destroy.push(() => el.removeEventListener(evt, fn))
    }))
  }
}



export function emit(evt, o, deps) {
  if (!this[symbols.deps](deps)) return this

  if (evt instanceof Event) {
    this.forEach(el => el.dispatchEvent(evt))
  }
  else if (typeof evt === 'string') {
    evt = evt.split(/\s+/)
    evt.forEach(evt => this.forEach(el => el.dispatchEvent(new CustomEvent(evt))))
  }
  else if (typeof evt === 'object') {
    this.forEach(el => el.dispatchEvent(new CustomEvent(evt.name, e)))
  }

  return this
}

import kebab from 'kebab-case'

const cancelled = {}
export function setMicrotask (fn, ctx) {
  let sym = Symbol('microtask')
  Promise.resolve().then(() => {
    if (cancelled[sym]) return
    delete cancelled[sym]
    fn()
  })
  return sym
}
export function clearMicrotask (sym) {
  cancelled[sym] = true
}

export const SPECT_CLASS = '👁'

export function isIterable(val) {
  if (isPrimitive(val)) return false
  if (val instanceof Node) return false
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export function isPrimitive(val) {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
}

export function isElement (arg) {
  return typeof arg === 'object' && arg && 'ownerDocument' in arg
}

export function isRenderable (arg) {
  if (arg === undefined) return false
  return arg === null || isPrimitive(arg) || Array.isArray(arg) || isElement(arg)
}


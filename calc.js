import state from './state.js'
import fx, { primitive, changeable } from './fx.js'

export default function calc(fn, deps) {
  const value = state(fn(...deps.map(v => {
    if (!v || primitive(v)) return v
    if ('current' in v) return v.current
    if ('valueOf' in v) return v.valueOf()
    if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]
    if (!changeable(v)) return v
  })))

  fx((...current) => {
    value(fn(...current))
  }, deps)

  return value
}

import state from './state.js'
import fx, { primitive } from './fx.js'

export default function calc(fn, deps) {
  const value = state(fn(...deps.map(v => {
    if (!v || primitive(v)) return v
    if ('current' in v) return v.current
    if (v.valueOf) return v.valueOf
  })))

  fx((...current) => {
    value(fn(...current))
  }, deps)

  return value
}

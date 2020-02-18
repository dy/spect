import state from './state.js'
import fx from './fx.js'
import { primitive, changeable } from './util.js'

export default function calc(fn, deps) {
  let prevDeps = deps.map(v => {
    if (!v || primitive(v)) return v
    if ('current' in v) return v.current
    if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]()
    if (changeable(v)) return
    if (typeof v === 'function') return v()
    return v
  })
  const value = state(fn(...prevDeps))

  const set = value.set
  value.set = () => {
    throw Error('setting read-only source')
  }

  // dfx logic, with initial prevDeps
  fx((...deps) => {
    if (deps.every((dep, i) => Object.is(dep, prevDeps[i]))) return
    prevDeps = deps
    set(fn(...deps))
  }, deps)

  return value
}

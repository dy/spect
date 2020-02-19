import state from './state.js'
import fx from './fx.js'
import { getval } from './util.js'

export default function calc(fn, deps) {
  let prevDeps = deps.map(getval)

  // make first sync call
  const value = state(fn(...prevDeps))

  const set = value.set
  value.set = () => {
    throw Error('Setting calculated value')
  }

  // dfx logic, with initial prevDeps
  fx((...deps) => {
    // make recalcs only if deps change
    if (deps.every((dep, i) => Object.is(dep, prevDeps[i]))) return
    prevDeps = deps
    set(fn(...deps))
  }, deps)

  return value
}

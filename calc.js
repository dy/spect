import state from './state.js'
import fx from './fx.js'
import { getval } from './src/util.js'

export default function calc(fn, deps) {
  let init = deps.map(getval)
  const value = state(fn(...init))

  const set = value.set
  value.set = () => {
    throw Error('Setting calculated value')
  }

  // dfx logic, with initial prev
  fx((...args) => {
    // some deps may keep reference, so avoid change check
    // if (args.every((dep, i) => Object.is(dep, prev[i]))) return
    // prev = args
    set(fn(...args))
  }, deps)

  return value
}

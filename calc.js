import state from './state.js'
import fx from './fx.js'

export default function calc(fn, deps) {
  let value, set

  fx((...args) => {
    if (!value) {
      value = state(fn(...args))
      set = value.set
      value.set = () => {
        throw Error('Setting calculated value')
      }
    }

    else {
      // some deps may keep reference, so avoid change check
      // if (args.every((dep, i) => Object.is(dep, prev[i]))) return
      // prev = args
      set(fn(...args))
    }
  }, deps, true)

  return value
}

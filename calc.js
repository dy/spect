import state from './state.js'
import fx from './fx.js'

export default function calc(fn, deps) {
  const value = state()

  fx((...current) => {
    value(fn(...current))
  }, deps)

  return value
}

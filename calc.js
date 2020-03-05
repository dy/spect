import fx from './fx.js'
import value from './value.js'

export default function calc(fn, deps) {
  const cur = value()
  fx((...args) => cur(fn(...args)), deps)
  return cur
}


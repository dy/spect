import fx from './fx.js'
import value from './value.js'

export default function calc(fn, deps) {
  const cur = value()
  fx((...args) => {
    let p = fn(...args)
    p.then ? p.then(cur) : cur(p)
  }, deps)
  return cur
}


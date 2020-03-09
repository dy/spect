import fx from './fx.js'
import value from './value.js'

export default function calc(fn, deps) {
  const cur = value(), { set } = cur
  fx((...args) => {
    let p = fn(...args)
    p.then ? p.then(set) : set(p)
  }, deps)
  cur.set = () => {}
  return cur
}


import { COMMIT, CALL } from './src/core.js'

export default function fx (fn, deps) {
  if (!COMMIT(this, 'fx', () => destroy.forEach(fn => fn && fn()), deps)) return

  let destroy = []

  // microtask fx after current stack
  Promise.resolve().then(() => {
    this.forEach(el => {
      CALL(el, () => {
        destroy.push(fn.call(el, el))
      })
    })
  })

  return this
}

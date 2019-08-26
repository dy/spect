import { DEPS } from './src/core.js'

export default function fx (fn, deps) {
  // report effect call
  commit(SET, this, 'fx', fn)

  if (!DEPS(deps, () => destroy.forEach(fn => fn && fn()))) return

  let destroy = []

  // microtask fx after current stack
  Promise.resolve().then(() => {
    this.forEach(el => {
      destroy.push(fn.call(el, el))
    })
  })

  return this
}

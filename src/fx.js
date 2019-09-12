import { symbols } from './core'

// optional effects
export default function fx(fn, deps) {
  if (!this[symbols.deps](deps, () => {
    destroy.forEach(fn => fn && (fn.call && fn()) || (fn.then && fn.then(res => res())))
  })) {
    return this
  }

  let destroy = []
  this.then(async () => {
    destroy.push(fn.call(this))
  })

  return this
}

import { commit, SET } from './src/core.js'

export default async function fx (fn, deps) {
  let p = commit(this, 'fx', SET, () => destroy.forEach(fn => fn && fn()), deps)
  if (!p) return

  await p

  let destroy = []

  this.forEach(el => {
    destroy.push(fn.call(el, el))
  })
}

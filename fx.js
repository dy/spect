import { commit, plan } from './src/core.js'
import tuple from 'immutable-tuple'


let prev = {}

export default function fx (fn, deps) {
  let id = commit(this, 'fx', deps)
  if (!id) return

  // destroy prev fx
  this.forEach(el => {
    if (prev[id]) {
      prev[id]()
    }
  })

  plan(() => this.forEach(el => {
    destroyCache.set(fn.call(el, el))
  }))
}

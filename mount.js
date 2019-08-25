import onload from 'fast-on-load'
import { commit, SET } from "./src/core"

// mount is post-effect
export default function mount (fn, deps) {
  let p = commit(this, 'mount', SET, () => destroy.forEach(fn => fn()), deps)

  if (!p) return

  let destroy = []

  this.forEach(el => {
    let unload
    let handle = [() => unload = fn(), () => unload && unload()]

    onload(el, ...handle)

    destroy.push(() => onload.destroy(el, ...handle))
  })
}


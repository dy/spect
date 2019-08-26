import onload from 'fast-on-load'
import { commit } from "./src/core"

// mount is post-effect
export default function mount (fn) {
  commit(SET, this, 'mount', fn)

  let destroy = []

  this.forEach(el => {
    let unload
    let handle = [() => unload = fn(), () => unload && unload()]

    onload(el, ...handle)

    destroy.push(() => onload.destroy(el, ...handle))
  })
}


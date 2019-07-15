import onload from 'fast-on-load'
import { currentTarget, callFx } from './spect.js'
import { noop } from './util.js'
import { beforeRender } from './render.js'

let tracking = new WeakMap()

export default function mount (fn) {
  if (!tracking.has(currentTarget)) {
    // we reset unmounts/mounts each new the same fx call
    tracking.set(currentTarget, {
      // planned callbacks
      mount: [],
      unmount: []
    })

    let target = currentTarget

    // FIXME: use native onload multiple binding capability
    onload(currentTarget, () => {
      let state = tracking.get(target)
      state.unmount = state.mount.map(fn => callFx('mount', fn || noop) || noop)
    }, () => {
      let state = tracking.get(target)
      state.unmount.forEach(fn => callFx('unmount', fn || noop))
    })

    // if target rerenders, reset mounted listeners (re-registered anyways)
    beforeRender(target, fn => {
      if (!tracking.has(target)) return

      let { mount, unmount } = tracking.get(target)
      mount.length = 0
    })
  }

  // mount array is clean for the first mount call
  let { mount } = tracking.get(currentTarget)
  mount.push(fn)
}




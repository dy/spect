import onload from 'fast-on-load'
import { currentTarget, callFx, beforeFx } from './spect.js'
import { noop } from './util.js'

let tracking = new WeakMap


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
  }

  // mount array is clean for the first mount call
  let { mount } = tracking.get(currentTarget)
  mount.push(fn)
}

// FIXME: beforeFx is too generic. It should be
// 'if target re-runs any of it's effects of the current stack level, reset mount listeners _of the current stack level_'
beforeFx((target) => {
  if (!tracking.has(currentTarget)) return

  // whenever we have a new aspect init call - reset mounts, they're re-registered each mount call
  let { mount, unmount } = tracking.get(currentTarget)
  mount.length = 0
})



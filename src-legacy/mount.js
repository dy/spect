import onload from 'fast-on-load'
import { currentState, currentTarget, callAspect } from './spect.js'
import { noop } from './util.js'

export default function mount (fn) {
  let state = currentState

  if (!state.mount) {
    // we reset unmounts/mounts each new the same fx call
    state.mount = []
    state.unmount = null

    // FIXME: use native onload multiple binding capability
    onload(currentTarget, () => {
      state.unmount = state.mount.map(fn => fn())
    }, () => {
      state.unmount.forEach(fn => fn())
    })

    // if target rerenders, reset mounted listeners (re-registered anyways)
    state.onBefore.push(() => {
      state.mount.length = 0
    })
  }

  // mount array is clean for the first mount call
  state.mount.push(fn)
}




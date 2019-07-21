import onload from 'fast-on-load'
import { currentTuple, currentTarget, callFx, tracking } from './spect.js'
import { noop } from './util.js'

export default function mount (fn) {
  let state = tracking.get(currentTuple)

  if (!state.mount) {
    // we reset unmounts/mounts each new the same fx call
    state.mount = []
    state.unmount = null

    // FIXME: use native onload multiple binding capability
    onload(currentTarget, () => {
      state.unmount = state.mount.map(fn => callFx(currentTarget, fn || noop) || noop)
    }, () => {
      state.unmount.forEach(fn => callFx(currentTarget, fn || noop))
    })

    // if target rerenders, reset mounted listeners (re-registered anyways)
    state.on('before', () => {
      state.mount.length = 0
    })
  }

  // mount array is clean for the first mount call
  state.mount.push(fn)
}




// Observing code is borrowed from https://github.com/hyperdivision/fast-on-load

import { callStack, tracking, effect } from './spect.js'
import { onload } from './util.js'


export default function mount (fn) {
  let [target, state] = callStack[callStack.length - 1]

  // if mount/unmount callbacks aren't registered - register the effect
  if (!state.mount) {
    state.isConnected = false
    state.mount = fn

    // handle already connected target
    effect(() => {
      if (isConnected(target)) {
        state.isConnected = true
        state.unmount = state.mount() || (()=>{})
      }
    })

    onload(target, () => {
      if (state.isConnected) return
      state.unmount = state.mount() || (()=>{})
      state.isConnected = true
    }, () => {
      if (!state.isConnected) return
      state.isConnected = false
      state.unmount()
    })
  }
}


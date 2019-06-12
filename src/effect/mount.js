// Observing code is borrowed from https://github.com/hyperdivision/fast-on-load

import { callStack, targetStates, afterEffect } from '../../index.js'
import { onload, isConnected } from '../util.js'


export default function mount (fn) {
  let [target, aspectState] = callStack[callStack.length - 1]
  let targetState = targetStates.get(target)
  let { aspect } = aspectState

  // if mount/unmount callbacks aren't registered - register the effect
  if (!aspectState.mount) {
    aspectState.isConnected = false
    aspectState.mount = fn

    // handle already connected target
    afterEffect(() => {
      if (isConnected(target)) {
        aspectState.isConnected = true
        aspectState.unmount = aspectState.mount() || (()=>{})
      }
    })

    onload(target, () => {
      if (aspectState.isConnected) return
      aspectState.unmount = aspectState.mount() || (()=>{})
      aspectState.isConnected = true
    }, () => {
      if (!aspectState.isConnected) return
      aspectState.isConnected = false
      aspectState.unmount()
    })
  }
}


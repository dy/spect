// Observing code is borrowed from https://github.com/hyperdivision/fast-on-load

import { callStack, targetStates } from '../../index.js'

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)


// FIXME: make this observer lazy
// export const observer = new MutationObserver(handleMutations)
// observer.observe(document.documentElement, {
//   childList: true,
//   subtree: true
// })

export const UNMOUNT = 0, MOUNT = 1

export default function mount (fn) {
  let [target, aspectState] = callStack[callStack.length - 1]
  let targetState = targetStates.get(target)
  let { aspect } = aspectState

  console.log('mount run', target, aspectState)
  // if mount/unmount callbacks aren't registered - register the effect
  if (!aspectState.mount) {
    aspectState.isConnected = false
    aspectState.mount = fn

    // handle already connected target
    // TODO: plan it for the next stage, after aspect run
    // plan(() => {
    //   if (isConnected(target)) {
    //     aspectState.isConnected = true
    //     aspectState.unmount = aspectState.mount() || ()=>{}
    //   }
    // })
  }

  // enqueue fx
//   if (!aspectState.isConnected && isConnected(target)) {
//     callFx('mount')
//   }
//
//   if (aspectState.isConnected && !isConnected(target)) {
//     callFx('unmount')
//   }
//
//   // listen for mount events
//   on('mount', () => {
//     aspectState.unmount = aspectState.mount()
//   })
//   on('unmount', () => {
//     if (aspectState.unmount.call) aspectState.unmount()
//   })
}

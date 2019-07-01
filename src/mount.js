// Observing code is borrowed from https://github.com/hyperdivision/fast-on-load

import { effect, aspectFx } from './spect.js'

export default function mount ({target, aspect, index, after, initArgs}, args) {
  if (tracking.has(target)) return

  let unmount
  // plan after rendering fx call to stack
  onload(target, () => {
    after(() => {
      unmount = fn || noop
    })
  }, () => {
    after(() => {
      unmount()
    })
  })
}



// the code is borrowed from https://github.com/hyperdivision/fast-on-load/blob/master/index.js
const tracking = new WeakMap()
const clz = 'onload-' + Math.random().toString(36).slice(2)
const observer = new window.MutationObserver(onchange)

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)

let off = true

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
})

function onload (node, onload, offload) {
  off = false
  node.classList.add(clz)
  tracking.set(node, [ onload || noop, offload || noop, 2 ])
  return node
}

function noop () { }

function callAll (nodes, idx, target) {
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].classList) continue
    if (nodes[i].classList.contains(clz)) call(nodes[i], idx, target)
    const els = nodes[i].getElementsByClassName(clz)
    for (let j = 0; j < els.length; j++) call(els[j], idx, target)
  }
}

function call (node, state, target) {
  const ls = tracking.get(node)
  if (ls[2] === state) return
  if (state === 0 && isConnected(node)) {
    ls[2] = 0
    ls[0](node, target)
  } else if (state === 1 && !isConnected(node)) {
    ls[2] = 1
    ls[1](node, target)
  }
}

function onchange (mutations) {
  if (off) return
  for (let i = 0; i < mutations.length; i++) {
    const { addedNodes, removedNodes, target } = mutations[i]
    callAll(removedNodes, 1, target)
    callAll(addedNodes, 0, target)
  }
}


// html effect
import htm from 'htm'
import { init as snabInit } from 'snabbdom'
import snabH from 'snabbdom/h'
import snabClass from 'snabbdom/modules/class'
import snabProps from 'snabbdom/modules/props'
import snabStyle from 'snabbdom/modules/style'
import snabAttrs from 'snabbdom/modules/attributes'
import snabEvent from 'snabbdom/modules/eventlisteners'
import snabDataset from 'snabbdom/modules/dataset'
import toVNode from 'snabbdom/tovnode'

import { currentTarget, callFx } from './spect.js'
import { isObject } from './util.js'

// patcher includes all possible decorators for now
// TODO: mb remove data-, attr-, class- and props- stuff
const patch = snabInit([
  snabClass, snabProps, snabAttrs, snabStyle, snabEvent, snabDataset
]);

// wrap snabH to connect to htm
function h(target, props, ...children) {
  if (!props) props = {}

  // spread operator returns original content
  if (target === '...') {
    let origContent = tracking.get(currentTarget).origContent
    return origContent
  }

  // fragment targets return array
  if (target === '') return children

  // nested fragments create nested arrays
  children = children.flat()

  return snabH(target, props, children)
}
const vhtml = htm.bind(h)


// vnodes per targets
const tracking = new WeakMap()

export default function html() {
  // takes current target
  let target = currentTarget

  if (!tracking.has(target)) {
    let vnode = toVNode(target)
    tracking.set(target, {vnode, origContent: vnode.children})
  }
  let state = tracking.get(target)
  // console.log(vhtml(...arguments))

  // builds target virtual DOM
  let newVnode = snabH(state.vnode.sel, state.vnode.data, vhtml(...arguments))
  console.log(state.vnode, newVnode)
  state.vnode = patch(state.vnode, newVnode)
}

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
  return snabH(target, props, children)
}
const vhtml = htm.bind(h)


// vnodes per targets
const tracking = new WeakMap()

export default function html() {
  // takes current target
  let target = currentTarget

  let oldVNode = tracking.has(target) ? tracking.get(target) : toVNode(target)

  // builds target virtual DOM
  let newVNode = snabH(oldVNode.sel, oldVNode.data, vhtml(...arguments))

  tracking.set(target, patch(oldVNode, newVNode));
}

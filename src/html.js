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

import { currentTarget, currentAspect, callFx, callAspect } from './spect.js'
import { MultikeyMap } from './util.js'

// patcher includes all possible decorators for now
// TODO: mb remove data-, attr-, class- and props- stuff
const patch = snabInit([
  snabClass, snabProps, snabAttrs, snabStyle, snabEvent, snabDataset
]);

// vnodes per targets
const tracking = new MultikeyMap()

// wrap snabH to connect to htm
function h(target, props, ...children) {
  if (!props) props = {}

  // DOM targets get their props / content updated
  if (target instanceof Node) {
    if (!tracking.has(target)) tracking.set(target, toVNode(target))
    let oldVnode = tracking.get(target)
    let newVNode = snabH(oldVnode.sel, {props}, children)
    tracking.set(target, patch(oldVnode, newVNode))
    return target
  }

  // Components create modifyable document fragment
  if (typeof target === 'function') {
    if (!tracking.has(target)) tracking.set(target, document.createDocumentFragment())
    let frag = tracking.get(target)
    Object.assign(frag, props)
    callAspect(frag, target)

    // unwrap fragment to plain list of children
    return frag.childNodes.length <= 1 ? frag.firstChild : [...frag.childNodes]
  }

  // fragment targets return array
  if (target === '') return children

  // nested fragments create nested arrays
  children = children.flat()

  return snabH(target, props, children)
}


export default function html(statics) {
  let vtree = htm.apply(h, arguments)

  if (Array.isArray(vtree)) return vtree.map(domify)

  return domify(vtree)
}

export function domify(vnode) {
  if (vnode instanceof Node) return vnode

  // FIXME: make sure we can't reuse element creation here
  let result = document.createElement(vnode.sel)
  patch(toVNode(result), vnode)

  return result
}

// html effect
import htm from 'htm'
import { init as snabInit } from 'snabbdom'
import snabH from 'snabbdom/h'
import toVNode from 'snabbdom/tovnode'

import { tracking, currentTarget, currentFx } from './spect.js'
import { } from './util.js'

// patcher includes all possible decorators for now
// TODO: mb remove data-, attr-, class- and props- stuff
const patch = snabInit();

// wrap snabH to connect to htm
function h(target, props, ...children) {
  if (!props) props = {}

  // DOM targets get their props / content updated
  // if (target instanceof Node) {
  //   if (!tracking.has(target)) tracking.set(target, toVNode(target))
  //   let oldVnode = tracking.get(target)
  //   let newVNode = snabH(oldVnode.sel, {props}, children)
  //   tracking.set(target, patch(oldVnode, newVNode))
  //   return target
  // }

  //  register web-component
  // if (typeof target === 'function') {
  //   if (!tracking.has(target)) {
  //     // TODO: differentiate class / function
  //     tracking.set(target, createComponent(target, props, children))
  //   }
  //   let { tagName } = tracking.get(target)

  //   return snabH(tagName, props, children)
  // }

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

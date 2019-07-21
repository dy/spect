// html effect
import htm from 'htm'
import { init as snabInit } from 'snabbdom'
import snabH from 'snabbdom/h'
import toVNode from 'snabbdom/tovnode'

import { tracking, currentTarget, currentFx } from './spect.js'
import { } from './util.js'

html.patch = snabInit([]);

html.h = function h(target, props, ...children) {
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
  // children = children.flat()

  return snabH(target, props, children)
}

html.htm = htm.bind(html.h)

export default function html(arg) {
  // TODO: handle input vtree separately
  // if (typeof arg === VDom)

  let vtree = html.htm(...arguments)

  // if (Array.isArray(vtree)) return vtree.map(domify)

  // FIXME: make sure we can't reuse element creation here

  let result = document.createElement(vnode.sel)
  html.patch(toVNode(result), vnode)

  return result
}


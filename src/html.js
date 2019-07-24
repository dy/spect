// html effect
import htm from 'htm'
import { init as snabInit } from 'snabbdom'
import snabH from 'snabbdom/h'
import snabProps from 'snabbdom/modules/props'
import toVNode from 'snabbdom/tovnode'
import morph from 'nanomorph'

import { currentTarget, currentState } from './spect.js'
import { } from './util.js'

// cache of vdom states assigned to elements
let cache = new WeakMap

html.patch = snabInit([snabProps]);

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
  // if (target === '') return children

  // nested fragments create nested arrays
  // children = children.flat()

  let parts = target.split('.')
  target = parts[0]

  let el = document.createElement(target)
  Object.assign(el, props)
  for (let i = 0; i < children.length; i++) {
    el.appendChild(children[i])
  }
  el.className = parts[1]

  return el
  // return snabH(target, {props}, children)
}

html.htm = htm.bind(html.h)

// build vdom from arguments
export function vhtml (arg) {
  if (!arg) return null

  if (typeof arg === 'string') return html.htm([arg])

  if (typeof arg === 'number') return arg

  if (isVdom(arg)) return arg

  if (arg.raw) {
    // html bypasses insertions, so if there's NodeList or Node we have to map again via vhtml
    let result = html.htm(...arguments)
    if (Array.isArray(result)) return result.map(vhtml).flat()
    return result
  }

  if (Array.isArray(arg)) return arg.map(vhtml).flat()

  if (arg instanceof NodeList) {
    if (!cache.has(arg)) cache.set(arg, vhtml([...arg]))
    return cache.get(arg)
    return [...arg]
  }

  if (arg instanceof Node) {
    // if (!cache.has(arg)) cache.set(arg, toVNode(arg))
    // return cache.get(arg)
    return arg
  }

  return html.htm([arg])
}

export default function html() {
  let vdom = vhtml(...arguments)

  let el = document.createElement(currentTarget.tagName)
  vdom.forEach(e => {
    if (Array.isArray(e)) e.forEach(e => el.appendChild(e))
    el.appendChild(typeof e === 'string' ? document.createTextNode(e) : e)
  })

  // // FIXME: make sure we can't reuse element creation here

  // if (!currentState.vdom) currentState.vdom = toVNode(currentTarget)

  // // FIXME: check for <host> element to avoid that
  // // if (Array.isArray(vdom)) vdom =
  // vdom = snabH(currentState.vdom.sel, currentState.vdom.data, vdom)

  // currentState.vdom = html.patch(currentState.vdom, vdom)

  morph(currentTarget, el)

  return currentTarget.childNodes.length === 1 ? currentTarget.firstChild : currentTarget.childNodes
}

function isVdom (arg) {
  return arg.sel !== undefined
}

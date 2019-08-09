import htm from 'htm'
import { patch,
  elementOpen,
  elementClose,
  elementVoid,
  text,
  attributes,
  symbols,
  applyProp,
  applyAttr,
  notifications,
  skip,
  currentElement
} from 'incremental-dom'

import { $ } from './$.js'
import { queue } from './use.js'
import { getTagName, getCustomElement } from './util.js';


$.fn.html = html


// configure incremental-dom attributes
attributes.class = applyAttr
attributes.is = (...args) => (applyAttr(...args), applyProp(...args))
attributes[symbols.default] = applyProp

// track aspects creation
// notifications.nodesCreated = function (nodes) {
//   console.log(nodes)
// }


// build vdom
$.h = html.h = function h(target, props={}, ...children) {
  let use, propsArr = []
  let staticProps = []
  let is, tag, classes = [], id, constructor

  if (typeof target === 'function') {
    tag = getTagName(target)
    constructor = getCustomElement(target)
  }

  // direct element
  else if (typeof target === 'string') {
    let [beforeId, afterId = ''] = target.split('#')
    let beforeClx = beforeId.split('.')
    tag = beforeClx.shift()
    let afterClx = afterId.split('.')
    id = afterClx.shift()
    classes = [...beforeClx, ...afterClx]
  }

  if (id) staticProps.push('id', id)
  if (classes.length) staticProps.push('class', classes.join(' '))

  // figure out effects: array props, anonymous aspects or child functions
  for (let prop in props) {
    let val = props[prop]
    // <div use=${use}>
    if (prop === 'use') use = Array.isArray(val) ? val : [val]

    if (prop === 'is') {
      // <div is=${fn}>
      if (typeof val === 'function') {
        is = getTagName(val)
        constructor = getCustomElement(val, tag)
        staticProps.push('is', is)
      }
      // <div is=name>
      // we don't touch that, user knows what he's doing
    }

    else propsArr.push(prop, val)
  }

  let key = id || (props && (props.key || props.id))

  // FIXME: use more static props, like type
  return {
    tag,
    key,
    use,
    is,
    constructor,
    props: propsArr,
    staticProps,
    children
  }
}

$.htm = html.htm = htm.bind(html.h)


export default function html(...args) {
  // let cache = currentState.htmlCache || (currentState.htmlCache = new WeakMap())

  // tpl string
  let vdom
  if (args[0].raw) vdom = html.htm(...args)

  // fn renderer html(h => h(...))
  else if (typeof args[0] === 'function') vdom = args[0](html.h)

  // direct JSX
  else vdom = args[0]

  if (!Array.isArray(vdom)) vdom = [vdom]

  // put DOM nodes aside
  // let count = 0, refs = {}

  // vdom = vdom.map(function map(arg) {
  //   if (arg instanceof Array) return arg.map(map)

  //   if (arg instanceof NodeList) {
  //     // cache initial nodes contents
  //     if (!cache.has(arg)) cache.set(arg, [...arg])

  //     // put nodes aside into fragment, to reinsert after re-rendered wrapper
  //     let frag = document.createDocumentFragment()
  //     cache.get(arg).forEach(arg => frag.appendChild(arg))
  //     let id = 'frag-' + count++
  //     refs[id] = frag
  //     return {ref: id}
  //   }
  //   if (arg instanceof Node) {
  //     arg.remove()
  //     let id = 'el-' + count++
  //     refs[id] = arg
  //     return {ref: id}
  //   }

  //   if (arg.children) arg.children = map(arg.children)

  //   return arg
  // })

  this.forEach(el => patch(el, render, vdom))

  function render (arg) {
    if (!arg) return

    // numbers/strings serialized as text
    if (typeof arg === 'number') return text(arg)
    if (typeof arg === 'string') return text(arg)

    // real dom nodes
    // if (arg.ref) {
    //   elementOpen('ref', arg.ref, ['id', arg.ref])
    //   skip()
    //   elementClose('ref')
    //   return
    // }

    // FIXME: .length can be wrong check
    if (arg.length) return [...arg].forEach(arg => render(arg))

    // objects create elements
    let { tag, key, props, staticProps, children, use, is } = arg

    // fragment (direct vdom)
    if (!tag) return children.forEach(render)

    let el

    // <ul is="custom-el" />
    if (is) {
      function create() { return document.createElement(tag, { is }) }
      el = elementOpen(create, key, staticProps, ...props);
      children.forEach(render)
      elementClose(create);
    }

    // if (!children) el = elementVoid(tag, key, staticProps, ...props)
    else {
      el = elementOpen(tag, key, staticProps, ...props)
      children.forEach(render)
      elementClose(tag)
    }

    // plan aspects init
    if (use) (new $(el)).use(...use)
  }

  // reinsert nodes
  // for (let id in refs) {
  //   let frag = refs[id]
  //   let holder = currentTarget.querySelector('#' + id)
  //   holder.replaceWith(frag)
  // }

  // return currentTarget.childNodes.length === 1 ? currentTarget.firstChild : currentTarget.childNodes

  return this
}

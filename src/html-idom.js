// incremental-dom based html implementation
import htm from 'htm'
import {
  patch,
  elementOpen,
  elementClose,
  text,
  attributes,
  symbols,
  applyProp,
  applyAttr,
  elementVoid,
  currentPointer,
  skipNode,
  notifications
} from 'incremental-dom'
import domdiff from 'domdiff'
import { isElement, isIterable, paramCase, SPECT_CLASS } from './util'


const _vnode = Symbol('vnode')


attributes.class = applyAttr
attributes.is = (target, name, value) => {
  if (target.setAttribute) applyAttr(target, name, value)
  return applyProp(target, name, value)
}
attributes[symbols.default] = applyProp


// render vdom into element
export default function html(el, ...args) {
  let content
  // html`<...>`
  // html(...)
  if (!args.length || (Array.isArray(el) && el.raw)) {
    content = htm.call(h, el, ...args)
    el = document.createDocumentFragment()
  }
  // html(el, ...)`
  else {
    content = args[0]
    // html('.selector', ...)
    if (typeof el === 'string') el = document.querySelectorAll(el)

  }

  if (isElement(el)) {
    // html(el, htmlContent)
    if (isElement(content) || isIterable(content)) {
      if (isElement(content)) content = [content]
      domdiff(el, [...el.childNodes], content)
    }
    else {
      patch(el, render, content)
    }
  }
  else el.forEach(el => patch(el, render, content))

  return el.childNodes.length === 1 ? el.firstChild : el.childNodes
}


/*
export default function html(el, ...args) {
  // html`<a foo=${bar}/>`
  let vdom
  if (args[0].raw) {
    vdom = htm.call(h, ...args)
  }

  // html('<a foo/>')
  else if (typeof args[0] === 'string') vdom = htm.call(h, args)

  // fn: html(children => [...children])
  else if (typeof args[0] === 'function') {
    let output = args[0](el)
    if (output && output !== el) {
      // substitute previous node with the new one in both DOM/spect collection

      // TODO: wrapping part is not ready
      // wrapping
      if (output[0].contains(el)) {
        throw Error('TODO: organize wrapping')
      }

      // new node
      else {
        el.replaceWith(...output)
      }

      // TODO: figure out if we need disposal here
      // if (el[_spect]) el[_spect].dispose()
    }
    return this
  }

  // html(<a foo={bar}/>)
  else vdom = args[0]

  // clear inner html
  if (!vdom) {
    el = el.childNodes.length === 1 ? el.firstChild : el.childNodes
  }

  if (!Array.isArray(vdom)) vdom = [vdom]
  // stub native nodes
  // FIXME: this removes elements from the initial tree instead of morphing
  let count = 0, refs = {}
  vdom = vdom.map(function map(arg) {
    // if (arg == null) return

    // if (Array.isArray(arg)) {
    //   if (!arg.length) return
    //   return arg.map(map)
    // }

    // if (arg instanceof NodeList || arg instanceof HTMLCollection) {
    //   let frag = el.ownerDocument.createDocumentFragment()
    //   while (arg.length) frag.appendChild(arg[0])
    //   refs[++count] = frag
    //   return { _ref: count }
    // }
    // if (arg instanceof DocumentFragment || typeof arg === 'function') {
    //   refs[++count] = arg
    //   return { _ref: count }
    // }
    // if (arg instanceof Node) {
    //   arg.remove()
    //   refs[++count] = arg
    //   return { _ref: count }
    // }

    // if (arg.children) arg.children = map(arg.children)

    return arg
  })

  patch(el, render.bind(this), vdom)

  // reinsert refs
  for (let id in refs) {
    // let refNode = el.querySelector('#' + SPECT_CLASS + '-ref-' + id)
    // let parent = refNode.parentNode
    // let next = refNode.nextSibling
    // if (typeof refs[id] === 'function') {
    //   parent.removeChild(refNode)
    //   let result = refs[id](parent)
    //   if (result != null) {
    //     let newNode = result instanceof Node ? result : document.createTextNode(result)
    //     next ? parent.insertBefore(newNode, next) : parent.appendChild(newNode)
    //   }
    // }
    // else {
    //   parent.replaceChild(refs[id], refNode)
    // }
  }

  return this
}
*/

function render(arg) {
  if (arg == null) return

  // numbers/strings are serialized as text
  if (typeof arg === 'number') return text(arg)
  if (typeof arg === 'string') return text(arg)

  if (isIterable(arg)) {
    for (let el of arg) render(el)
    return
  }

  if (isElement(arg)) {
    let el = elementVoid(function () { return arg })
    return
  }

  if (typeof arg === 'object' && !arg[_vnode]) return text(arg.toString())

  // objects create elements
  let { tag, key, props, staticProps, children } = arg

  // fragment (direct vdom)
  if (!tag) return children && children.forEach(render)

  let el
  if (!children || !children.length) {
    el = elementVoid(tag, key, staticProps, ...props)
  }
  else {
    el = elementOpen(tag, key, staticProps, ...props)
    children.forEach(render)
    elementClose(tag)
  }
}


export function h(target, props = {}, ...children) {
  // <${el}></> - ignored from insertion
  if (isElement(target)) {
    patch(target, render, children)
    return null
  }

  let propsList = []
  let staticProps = []
  let tag, classes = [], id

  if (typeof target === 'string') {
    let parts = parseTag(target)
    tag = parts[0]
    id = parts[1]
    classes = parts[2]
  }

  for (let prop in props) {
    let val = props[prop]
    propsList.push(prop, val)
  }

  if (id) staticProps.push('id', id)
  if (classes.length) propsList.push('class', classes.join(' '))
  let key = id || (props && (props.key || props.id))

  // FIXME: use more static props, like `type`
  return {
    [_vnode]: true,
    tag,
    key,
    props: propsList,
    staticProps,
    children
  }
}


// a#b.c.d => ['a', 'b', ['c', 'd']]
function parseTag(str) {
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}

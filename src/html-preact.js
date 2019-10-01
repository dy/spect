// preact-based html implementation
// portals have discrepancy with

import { createElement, render, Fragment } from 'preact'
import htm from 'htm'
import { isElement, isIterable, isPrimitive } from './util'
import { publish } from './core'

let p = Promise.resolve()

let planned = null
function planRender(vdom) {
  if (!planned) {
    p = p.then(() => {
      if (!planned) return vdom
      let frag = document.createDocumentFragment()
      render(planned, frag)
      planned = null
      return frag.childNodes.length === 1 ? frag.firstChild : frag
    })
  }
  planned = vdom
  vdom.then = p.then.bind(p)
  return vdom
}

// render vdom into element
export default function html (...args) {
  let vdom = htm.call(h, ...args)

  // real dom in fact
  if (isElement(vdom)) {
    // clean planned things
    planned = null
    return vdom
  }
  if (isPrimitive(vdom)) {
    return vdom
  }
  if (isIterable(vdom)) {
    let onlyReal = true
    for (let item of vdom) {
      if (!isElement(item)) {
        onlyReal = false; break;
      }
    }
    if (onlyReal) return vdom
    return planRender(vdom)
  }

  return planRender(vdom)
}

function toVdom(el) {
  // FIXME: there can be a better clone
  let props = {
    ref: node => {
      if (node) node.append(...el.childNodes)
    }
  }
  for (let attr of el.attributes) {
    let value = attr.value
    props[attr.name] = attr.value
  }
  let proto = el.constructor.prototype
  for (let name in el) {
    if (!(name in proto)) props[name] = el[name]
  }

  return createElement(el.tagName, props)
}

function h(tagName, props, ...children) {
  children = children.flat().map(child => isElement(child) ? toVdom(child) : child)
  if (!props) props = {}

  if (isElement(tagName)) {
    // html`<${el}.a.b.c />`
    for (let name in props) {
      let value = props[name]
      if (value === true && name[0] === '#' || name[0] === '.') {
        let [, id, classes] = parseTag(name)
        if (id && !props.id) tagName.id = id
        if (classes.length) {
          classes.forEach(cl => tagName.classList.add(cl))
        }
      }
      else {
        tagName[name] = value
      }
    }

    // return createPortal(toChildArray(children), tagName)
    render(children, tagName)
    return tagName
  }
  if (typeof tagName !== 'string') {
    return createElement(...arguments)
  }

  if (!tagName) {
    return Fragment({ children })
  }

  if (!props) props = {}
  let [tag, id, classes] = parseTag(tagName)
  if (!props.id && id) props.id = id
  if (!props.className && classes.length) props.className = classes.join(' ')

  // put props to real elements
  let ref = props.ref
  props.ref = (el) => {
    for (let name in props) {
      if (name === 'ref') continue
      // FIXME: pract X-only effect - it automatically assigns props
      if (el[name] == null) el[name] = props[name]
      publish([el, 'prop', name])
    }
    ref && ref.call && ref(el)
  }

  return createElement(tag, props, ...children)
}

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

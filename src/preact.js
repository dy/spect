// preact-based html implementation
// portals have discrepancy with

import { createPortal, createElement, render as prender } from 'preact/compat'
import htm from 'htm'
import { isElement, isIterable } from './util'
import domdiff from 'domdiff'


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
      prender(content, el)
    }
  }
  else el.forEach(prender(content, el))

  return el.childNodes.length === 1 ? el.firstChild : el.childNodes
}


function h(tagName, props, ...children) {
  if (isElement(tagName)) {
    return createPortal(children, tagName)
  }

  if (typeof tagName !== 'string') return createElement(...arguments)

  if (!props) props = {}
  let [tag, id, classes] = parseTag(tagName)
  if (!props.id) props.id = id
  if (!props.class) props.class = classes.join(' ')

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

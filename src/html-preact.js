// preact-based html implementation
// portals have discrepancy with

import { createElement, render } from 'preact/compat'
import htm from 'htm'
import { isElement } from './util'


// render vdom into element
export default htm.bind(h)

function h(tagName, props, ...children) {
  if (isElement(tagName)) {
    return render(children, tagName)
  }

  if (typeof tagName !== 'string') return createElement(...arguments)

  if (!props) props = {}
  let [tag, id, classes] = parseTag(tagName)
  if (!props.id && id) props.id = id
  if (!props.class && classes.length) props.class = classes.join(' ')

  // put props to real elements
  let ref = props.ref
  props.ref = (el) => {
    for (let name in props) {
      if (!el[name]) el[name] = props[name]
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

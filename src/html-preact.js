// preact-based html implementation
// portals have discrepancy with

import { createElement, render as preactRender, Fragment, hydrate } from 'preact'
import htm from 'htm'
import { isElement, SPECT_CLASS } from './util'
import { publish } from './core'


// render vdom into element
export default htm.bind(h)

function toVdom(el) {
  if (el.nodeType === 3) return el.textContent
  if (el.nodeType !== 1) return

  el.classList.add(SPECT_CLASS + '-replaced')
  const props = {
    ref: node => {
      node && node.replaceWith(el)
      el[_replaced] = node
    }
  }

  return createElement(el.tagName.toLowerCase(), props)
}

const _replaced = Symbol('replaced')
const elCache = new WeakSet
export function render (vdom, el) {
  // unreplace
  el.querySelectorAll(`.${SPECT_CLASS}-replaced`).forEach(el => {
    el.replaceWith(el[_replaced])
  })

  if (!elCache.has(el)) {
    if (el.childNodes.length) {
      hydrate(vdom, el)
    }
    else {
      preactRender(vdom, el)
    }
  }
  else {
    preactRender(vdom, el)
  }

  elCache.add(el)
}

function h(tagName, props, ...children) {
  children = children.flat().map(child => isElement(child) ? toVdom(child) : child)
  if (!props) props = {}
  // html`<.target>...</>`
  if (tagName[0] === '.' || tagName[0] === '#') {
    tagName = document.querySelector(tagName)
  }
  if (!tagName) {
    return Fragment({ children })
  }

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
        tagName.setAttribute(name, value)
        tagName[name] = value
      }
    }
    render(children, tagName)

    return tagName
  }

  if (typeof tagName !== 'string') return createElement(tagName, props, children)

  if (!props) props = {}
  let [tag, id, classes] = parseTag(tagName)
  if (!props.id && id) props.id = id
  if (!props.className && classes.length) props.className = classes.join(' ')

  // put props to real elements
  let ref = props.ref
  props.ref = (el) => {
    if (!el) return
    for (let name in props) {
      if (name === 'ref') continue
      // FIXME: pract X-only effect - it automatically assigns props
      if (el[name] == null) el[name] = props[name]
      publish([el, 'prop', name])
    }
    ref && ref.call && ref(el)
  }

  return createElement(tag, props, children)
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

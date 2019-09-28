// domdiff html implementation
import htm from 'htm'
import { isElement } from './util'
import morph from 'nanomorph'
import clsx from 'clsx'


export default function html (...args) {
  let result = htm.call(h, ...args)
  if (typeof result === 'string') return document.createTextNode(result)
  return result
}

function h(tag, props, ...children) {
  children = children.flatten().map(child =>
    isElement(child) ? child
    : document.createTextNode(child)
  )
  if (!props) props = {}

  // html`<${el}>...</>`
  if (isElement(tag)) {
    // html`<${el}.a.b.c />`
    for (let name in props) {
      let value = props[name]
      if (value === true && name[0] === '#' || name[0] === '.') {
        let [, id, classes] = parseTag(name)
        if (id && !props.id) props.id = id
        if (classes.length) (props.class = (props.class || [])).push(...classes)
      }
    }

    morph(tag, createElement(tag.tagName, props, children))
    return tag
  }
  // html`<${C} />`
  else if (typeof tag === 'function') {
    props.children = children
    return tag(props)
  }

  if (typeof tag !== 'string') return createElement(...arguments)

  let [tagName, id, classes] = parseTag(tag)
  if (id && !props.id) props.id = id
  if (classes.length) (props.class = (props.class || [])).push(...classes)

  return createElement(tagName, props, children)
}

function createElement(el, props, children) {
  if (!el) el = document.createDocumentFragment()
  else if (typeof el === 'string') el = document.createElement(el)

  for (let name in props) {
    let value = props[name]
    if (name === 'style') {
      if (typeof value === 'string') el.style.cssText = value
      else {
        for (let styleProp in value) {
          el.style.setProperty(styleProp, value[styleProp])
        }
      }
    }
    else if (name === 'class') {
      el.className = clsx(value)
    }
    else if (name.substr(0, 5) === 'data-') {
      el.setAttribute(name, value)
    }
    else {
      el[name] = value
    }
  }

  if (children) el.append(...children)
  return el
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

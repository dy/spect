// domdiff html implementation
import htm from 'htm'
import { isElement, paramCase } from './util'
import morph from 'morphdom'
import clsx from 'clsx'
import { publish } from './core'
import equal from 'fast-deep-equal'
import 'array-flat-polyfill'

const propsCache = new WeakMap()

let cuerrentUseCache

export default function html (...args) {
  currentUseCache = new Set()

  let result = htm.call(h, ...args)
  if (typeof result === 'string') return document.createTextNode(result)

  // apply use
  for (let el of currentUseCache) {
    used(el)
  }

  if (Array.isArray(result)) {
    let frag = document.createDocumentFragment()
    frag.append(...result)
    return frag
  }

  return result
}

function used (el) {
  let uselist = [el.is, el.use].flat().filter(Boolean)

  let fn, result, props = propsCache.get(el) || {}
  while (fn = uselist.shift()) {
    for (let attr of el.attributes) {
      if (!(attr.name in props)) props[attr.name] = attr.value
    }
    result = fn(el, props)
    if (result !== undefined) {
      let repl = isElement(result) ? result : html`<>${result}</>`
      el.replaceWith(repl)
      el = repl
    }
  }
  return el
}


function h(tag, props, ...children) {
  children = children.flat()
    .filter(child => typeof child === 'number' || child)
    .map(child =>
      isElement(child) ? child
      : document.createTextNode(child)
    )
  if (!props) props = {}

  // html`<.sel></>`
  if (typeof tag === 'string' && (tag[0] === '#' || tag[0] === '.')) {
    tag = document.querySelector(tag)
    if (!tag) return
  }

  // html`<${el}>...</>`
  if (isElement(tag)) {
    // html`<${el}.a.b.c />`
    for (let name in props) {
      let value = props[name]
      if (value === true && name[0] === '#' || name[0] === '.') {
        let [, id, classes] = parseTag(name)
        if (id && !props.id) props.id = id
        if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')
        delete props[name]
      }
    }

    // don't override initial tag id
    if (tag.id && !props.id) props.id = tag.id

    // keep attributes
    if (tag.attributes) {
      for (let attr of tag.attributes) {
        if (!props[attr.name]) props[attr.name] = attr.value
      }
    }

    let newTag = createElement(tag.tagName, props, children)
    morph(tag, newTag, {
      getNodeKey: (el) => {
        return el.key || el.id
      },
      onBeforeElUpdated: (fromEl, toEl) => {
        // FIXME: this blocks updating
        // if (fromEl.isEqualNode(toEl)) {
        //   return false
        // }

        if (propsCache.has(toEl)) {
          let changedProps = propsCache.get(toEl)
          for (let prop of changedProps) {
            if (!equal(fromEl[prop], toEl[prop])) {
              fromEl[prop] = toEl[prop]
              publish([fromEl, 'prop', prop])
            }
            // propsCache.delete(prop)
          }
        }

        return true
      }
    })
    return tag
  }


  // html`<${C}/>`
  if (typeof tag === 'function') {
    props.children = children

    let el = createElement(tag.name && paramCase(tag.name), { is: props.is })

    let result = tag(el, props)
    return result === undefined ? el : result
  }


  // html`<>content...</>`
  let [tagName, id, classes] = parseTag(tag)
  if (id && !props.id) props.id = id
  if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')

  let el = createElement(tagName, props, children)
  return el
}

function createElement(el, props, children) {
  if (!el) el = document.createDocumentFragment()
  else if (typeof el === 'string') el = document.createElement(el, {is: props.is})

  if (props) applyProps(el, props)
  if (children) el.append(...children)
  return el
}

function applyProps(el, props) {
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
      if (name === 'use' || name === 'is') currentUseCache.add(el)
      if (!propsCache.has(el)) propsCache.set(el, new Set)
      propsCache.get(el).add(name)
    }
  }
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

// preact-based html implementation
// portals have discrepancy with

import { createElement, render as preactRender, Fragment, hydrate } from 'preact'
import htm from 'htm'
import { isElement, SPECT_CLASS } from './util'
import { publish } from './core'
import tuple from 'immutable-tuple'


// render vdom into element
export default htm.bind(h)

const _vdom = Symbol('vdom')
const _slot = Symbol('slot')
const _repl = Symbol('repl')

const testCache = new Map


const elCache = new WeakSet
export function render (vdom, el) {
  // unreplace
  // el.querySelectorAll(`.${SPECT_CLASS}-repl`).forEach(el => {
  //   el.replaceWith(el[_slot])
  // })

  if (!elCache.has(el)) {
    if (el.childNodes.length) {
      // fake-hydrate existing content to enable diffing
      // let vdom = toVdom([...el.childNodes])
      // hydrate(vdom, el)
    }
  }
  elCache.add(el)
  preactRender(vdom, el)
}

function h(tagName, props, ...children) {
  children = children.flat().map(child => isElement(child) ? toVdom(child) : child)
  // .map(child => isElement(child) ? createElement('slot', {
  //   ref: slot => {
  //     if (!slot) return
  //     slot[_repl] = child
  //     child[_slot] = slot
  //     child.classList.add(SPECT_CLASS + '-repl')
  //     slot.replaceWith(child)
  //     // child.append(...slot.childNodes)
  //   }
  // }) : child)

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


    // replace slots
    // let slots = [...tagName.querySelectorAll('.' + SPECT_CLASS + '-slot')]
    // slots.forEach(el => {
    //   el[_repl][_slot] = el
    //   el[_repl].classList.add(SPECT_CLASS + '-repl')
    //   if (!el[_repl].isConnected) el.replaceWith(el[_repl])
    //   console.log(el.outerHTML, '--- TO ---', el[_repl].outerHTML, el.parentNode, el[_repl].parentNode, tagName.outerHTML)
    // })

    return tagName
  }

  if (typeof tagName !== 'string') return createElement(tagName, props, children)

  if (!props) props = {}
  let [tag, id, classes] = parseTag(tagName)
  if (!props.id && id) props.id = id
  if (classes.length) props.class = [props.class, ...classes].filter(Boolean).join(' ')

  props = handleCustomProps(tag, props)

  return createElement(tag, props, children)
}

const reserved = ['is', 'ref', 'children']
function handleCustomProps(tag, props) {
  let testEl = testCache.get(tuple(tag, props.is))
  if (!testEl) testCache.set(tuple(tag, props.is), testEl = document.createElement(tag, { is: props.is }))

  // if vnode has custom props for specific element - put them as props on the created element
  let customProps = []
  for (let name in props) {
    if (reserved.indexOf(name) >= 0) continue
    if (name in testEl) continue
    if (name[0] === '_') continue
    customProps.push(name)
  }

  if (!customProps.length) return props

  let ref = props.ref
  props.ref = (el) => {
    if (!el) return
    customProps.forEach(name => {
      if (el[name] === undefined) el[name] = props[name]
      publish([el, 'prop', name])
    })
    ref && ref.call && ref(el)
  }

  return props
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

function toVdom(el) {
  if (el[_vdom]) {
    return el[_vdom]
  }
  if (Array.isArray(el)) return el.map(toVdom)
  if (el.nodeType === 3) return el.textContent

  // document fragment
  if (el.nodeType === 11) return [...el.childNodes].map(toVdom)

  if (el.nodeType !== 1) return

  let props = {}
  for (let attr of el.attributes) {
    props[attr.name] = attr.value
  }
  // pick up props not defined in proto
  // Object.getOwnPropertyNames(el).filter(name => name[0] !== '_')
  // .forEach(name => props[name] = el[name])
  // if (elProps.length) {
  //   props.ref = el => {
  //     if (!el) return
  //     elProps.forEach(name => !el.hasOwnProperty(name) && (el[name] = props[name]) )
  //   }
  // }

  return el[_vdom] = createElement(el.tagName.toLowerCase(), props, [...el.childNodes].map(toVdom))
}

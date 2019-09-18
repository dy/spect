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
  skipNode
} from 'incremental-dom'
import { isIterable, paramCase } from './util'

attributes.class = applyAttr
attributes.is = (...args) => (applyAttr(...args), applyProp(...args))
attributes[symbols.default] = applyProp


const _target = Symbol.for('spect.target')
const _instance = Symbol.for('spect.instance')

const SPECT_CLASS = '👁'

export default function html(...args) {
  let el = this[_target] || this

  // tpl string: html`<a foo=${bar}/>`
  let vdom
  if (args[0].raw) vdom = htm.call(h, ...args)

  // html('<a foo/>')
  // else if (typeof args[0] === 'string') vdom = html(args)

  // fn: html(children => [...children])
  else if (typeof args[0] === 'function') {
    let input = [...el.childNodes]
    let output = args[0](input)
    html.call(this, output)
    return this
  }

  // direct JSX: html(<a foo={bar}/>)
  else vdom = args[0]

  // clear inner html
  if (!vdom) {
    while (el.firstChild) el.removeChild(el.firstChild)
    return this
  }

  if (!Array.isArray(vdom)) vdom = [vdom]

  // stub native nodes
  let count = 0, refs = {}
  vdom = vdom.map(function map(arg) {
    if (arg == null) return

    if (Array.isArray(arg)) {
      if (!arg.length) return
      return arg.map(map)
    }

    if (arg instanceof NodeList || arg instanceof HTMLCollection) {
      let frag = document.createDocumentFragment()
      while (arg.length) frag.appendChild(arg[0])
      refs[++count] = frag
      return { ref: count }
    }
    if (arg instanceof DocumentFragment || typeof arg === 'function') {
      refs[++count] = arg
      return { ref: count }
    }
    if (arg instanceof Node) {
      arg.remove()
      refs[++count] = arg
      return { ref: count }
    }

    if (arg.children) arg.children = map(arg.children)

    return arg
  })

  patch(el, render.bind(this), vdom)

  // reinsert refs
  for (let id in refs) {
    let refNode = el.querySelector('#' + SPECT_CLASS + '-ref-' + id)
    let parent = refNode.parentNode
    let next = refNode.nextSibling
    if (typeof refs[id] === 'function') {
      parent.removeChild(refNode)
      let result = refs[id](parent)
      if (result != null) {
        let newNode = result instanceof Node ? result : document.createTextNode(result)
        next ? parent.insertBefore(newNode, next) : parent.appendChild(newNode)
      }
    }
    else {
      parent.replaceChild(refs[id], refNode)
    }
  }

  return this
}

function render(arg) {
  if (arg == null) return

  // numbers/strings are serialized as text
  if (typeof arg === 'number') return text(arg)
  if (typeof arg === 'string') return text(arg)

  if (isIterable(arg)) {
    for (let el of arg) render.call(this, el)
  }

  // stub refs to native els
  if (arg.ref) return elementVoid('span', null, ['id', SPECT_CLASS + '-ref-' + arg.ref])

  // objects create elements
  let { tag, key, props, staticProps, children, use, create, fn } = arg

  // fragment (direct vdom)
  if (!tag) return children && children.forEach(render, this)

  let el
  if (!children || !children.length) {
    el = elementVoid(create, key, staticProps, ...props)
  }
  else {
    el = elementOpen(create, key, staticProps, ...props)
    children.forEach(render, this)
    elementClose(create)
  }

  // if spect instance - init aspects
  if (this[_instance]) {
    let Spect = this[_instance].constructor
    let proto = Spect.prototype

    const $el = new Spect(el)
    $el.element = el

    if (fn) $el.use(fn)
    if (use) {
      $el.use(use)
    }

    for (let i = 0, key, value; i < props.length; i += 2) {
      key = props[i], value = props[i + 1]
      if (key in proto) $el[key](value)
    }
  }
}


const isCustomElementsAvailable = typeof customElements !== 'undefined'
const customElementsCache = {}
export function h(target, props = {}, ...children) {
  let use = [], propsList = []
  let staticProps = []
  let tag, classes = [], id, create, is, fn

  if (typeof target === 'function') {
    fn = target
    tag = getTagName(fn)

    if (isCustomElementsAvailable) {
      if (!customElements.get(tag)) customElements.define(tag, createClass(HTMLElement))
    }
  }
  else if (typeof target === 'string') {
    let parts = parseTagComponents(target)
    tag = parts[0]
    id = parts[1]
    classes = parts[2]
  }

  for (let prop in props) {
    let val = props[prop]
    // <div use=${use}>
    if (prop === 'use') Array.isArray(val) ? use.push(...val) : use.push(val)

    // <div is=${fn}>
    else if (prop === 'is') {
      if (typeof val === 'function') {
        fn = val
        is = getTagName(fn)
        staticProps.push('is', is)

        if (isCustomElementsAvailable) {
          if (!customElements.get(is)) {
            let Component = createClass(Object.getPrototypeOf(document.createElement(tag)).constructor)
            customElements.define(is, Component, { extends: tag })
            create = customElementsCache[is] = function () { return document.createElement(tag, { is }) }
          }
          else {
            create = customElementsCache[is]
          }
        }
      }
      // <div is=name>
      // we don't touch that, user knows what he's doing
    }

    // <${Component}#x.y.z/> htm props hack
    else if (val === true && prop[0] === '#' || prop[0] === '.') {
      let parts = parseTagComponents(prop)
      if (!id && parts[1]) id = parts[1]
      classes.push(...parts[2])
    }

    else {
      propsList.push(prop, val)
    }
  }

  if (id) staticProps.push('id', id)
  if (classes.length) propsList.push('class', classes.join(' '))

  if (!create) create = tag

  let key = id || (props && (props.key || props.id))

  // FIXME: use more static props, like `type`
  return {
    tag,
    key,
    use,
    create,
    props: propsList,
    staticProps,
    children,
    is,
    fn
  }
}


// a#b.c.d => ['a', 'b', ['c', 'd']]
function parseTagComponents(str) {
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}

let nameCache = new WeakMap
const counters = {}
function getTagName(fn) {
  if (nameCache.has(fn)) return nameCache.get(fn)

  // do not allow anonymous functions in aspects
  if (!fn.name && currentElement) throw Error('Component function should have a name')
  let name = fn.name ? paramCase(fn.name) : 'spect'

  // add num suffix to single-word names
  let parts = name.split('-')
  if (parts.length < 2) {
    if (!counters[name]) counters[name] = 0
    name += '-' + (counters[name]++)
  }

  nameCache.set(fn, name)

  return name
}

// TODO: make use of connected/disconnected callbacks
function createClass(HTMLElement) {
  return class HTMLSpectComponent extends HTMLElement {
    constructor() {
      super()
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }
  }
}

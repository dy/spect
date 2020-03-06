import attr from './attr.js'
import from, { observable } from './from.js'

let cleanupFuncs = [],
    _group = Symbol('group'),
    TEXT = 3

export default function h(tag, props, ...children) {
  if (!props) props = {}

  if (tag == null) return document.createTextNode('')

  // element
  let el = null
  if (tag == null) el = document.createTextNode('')
  else if (typeof tag === 'string') {
    el = tag ? document.createElement(tag) : document.createDocumentFragment()
  }
  else if (typeof tag === 'function') el = tag(props) || document.createTextNode('')
  else if (tag.nodeType) el = tag
  else if (tag[Symbol.iterator]) {
    el = document.createTextNode('')
    el[_group] = [...tag].map(el => el.nodeType ? el : document.createTextNode(el == null ? '' : el))
  }

  // props
  for (let name in props) {
    let value = props[name]
    if(observable(value)) {
      cleanupFuncs.push(from(value)(value => (attr.set(el, name, value), el[name] = value)))
    }
    else {
      attr.set(el, name, value)
      el[name] = value
    }
  }

  // children
  children.map(function create (child) {
    if (child == null) return

    if('string' === typeof child
      || 'number' === typeof child
      || 'boolean' === typeof child
      || child instanceof Date
      || child instanceof RegExp ) return el.appendChild(document.createTextNode(child.toString()))

    if(child.nodeType) return el.appendChild(child)

    if (observable(child)) {
      let cur = el.appendChild(document.createTextNode(''))
      cleanupFuncs.push(from(child)(child => {
        cur = replaceWith(cur , child)
      }))
      return cur
    }

    if (child[Symbol.iterator]) return [...child].map(create)
  })

  return el
}

h.cleanup = function () {
  for (let i = 0; i < cleanupFuncs.length; i++){
    cleanupFuncs[i]()
  }
  cleanupFuncs.length = 0
}

function replaceWith(from, to) {
  if (!to.nodeType && to[Symbol.iterator]) {
    let items = [...to]
    to = document.createTextNode('')
    to[_group] = items.map(el => el && el.nodeType ? el : document.createTextNode(el == null ? '' : el))
  }
  else if (to == null) to = ''

  if (from[_group]) from[_group].map(el => el.remove())

  if (to.nodeType) {
    if (to[_group]) {
      let frag = document.createDocumentFragment()
      frag.appendChild(to)
      to[_group].map(el => frag.appendChild(el))
      from.replaceWith(frag)
    }
    else {
      from.replaceWith(to)
    }
  }
  else {
    if (from.nodeType !== TEXT) from.replaceWith(to = document.createTextNode(to.toString()))
    else from.textContent = to.toString()
  }

  return to
}

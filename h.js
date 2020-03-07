import attr from './attr.js'
import from, { observable, primitive } from './from.js'

let cleanupFuncs = []

const _group = Symbol('group'),
    _ptr = Symbol('ptr')
const TEXT = 3, ELEMENT = 1

h.cleanup = function () {
  for (let i = 0; i < cleanupFuncs.length; i++){
    cleanupFuncs[i]()
  }
  cleanupFuncs.length = 0
}

export default function h(tag, props, ...children) {
  if (!props) props = {}

  if (tag == null) return document.createTextNode('')

  // element
  let el = null
  if (tag == null) el = document.createTextNode('')
  else if (tag.nodeType) el = tag
  else if (typeof tag === 'string') {
    el = tag ? document.createElement(tag) : document.createDocumentFragment()
  }
  else if (typeof tag === 'function') el = tag(props) || document.createTextNode('')
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
  render(children, el)

  return el
}

export function render(children, el) {
  return children.map((child) => {
    if (observable(child)) {
      let cur
      cleanupFuncs.push(
        from(child)(child => {
          cur = !cur ? alloc(el, createChild(child)) : replaceWith(cur, createChild(child))
        })
      )
      // if sync init did not hit - create placeholder, no hydration posible
      if (!cur) alloc(el, createChild(''))
      return cur
    }

    return alloc(el, createChild(child))
  })
}

function createChild(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) return document.createTextNode(arg)

  // can be node/fragment
  // reset pointer - the element is considered re-allocatable
  if (arg.nodeType) return (arg[_ptr] = 0, arg)

  // can be an array / array-like
  if (arg[Symbol.iterator]) {
    let marker = document.createTextNode('')
    marker[_group] = [...arg].flat().map(arg => createChild(arg))
    return marker
  }

  return arg
}

// locate/allocate node[s] in element
function alloc(parent, el) {
  if (!parent) return el

  // track passed children
  if (!parent[_ptr]) parent[_ptr] = 0

  // look up for good candidate
  let nextNode = parent.childNodes[parent[_ptr]], match

  // if no available nodes to locate - append new nodes
  if (!nextNode) {
    appendChild(parent, el)
    return el
  }

  // FIXME: locate groups
  if (el[_group]) {
    // let nodes = []
    // for (let i = 0; i < el[_group].length; i++ ) nodes.push(alloc(parent, el[_group][i]))
    // return nodes
    insertBefore(parent, el, nextNode)
    return el
  }

  // find matching node somewhere in the tree
  for (let i = parent[_ptr]; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i]
    if (
      // same node
      node === el ||
      (node.isSameNode && node.isSameNode(el)) ||
      (node[_group] && el[_group]) ||
      (node.tagName === el.tagName && (
        // same-key node
        (node.id && (node.id === el.id)) ||

        // same-content text node
        (node.nodeType === TEXT && node.nodeValue === el.nodeValue && !node[_group]) ||

        // just blank-ish tag matching by signature and no need morphing
        (node.nodeType === ELEMENT && !node.id && !el.id && !el.name && !node.childNodes.length)
      ))
    ) {
      match = node
      break
    }
    else if (node[_group]) {
      i += node[_group].length
    }
  }

  // if there is match in the tree - insert it at the curr pointer
  if (match) {
    if (match !== nextNode) insertBefore(parent, match, nextNode)
    else parent[_ptr]++
    return match
  }

  insertBefore(parent, el, nextNode)
  return el
}

// group-aware manipulations
function appendChild(parent, el) {
  parent.appendChild(el)
  if (el[_group]) el[_group].map(el => parent.appendChild(el))
  parent[_ptr] += 1 + (el[_group] ? el[_group].length : 0)
}
function insertBefore(parent, el, before) {
  parent.insertBefore(el, before)
  if (el[_group]) {
    el[_group].map(item => parent.insertBefore(item, el))
    // swap group pointer to the beginning
    parent.insertBefore(el, el[_group][el[_group].length - 1])
  }
  parent[_ptr] += 1 + (el[_group] ? el[_group].length : 0)
}
function replaceWith(from, to) {
  if (from[_group]) from[_group].map(el => el.remove())

  if (to[_group]) {
    let frag = document.createDocumentFragment()
    frag.appendChild(to)
    to[_group].map(el => frag.appendChild(el))
    from.replaceWith(frag)
  }
  else {
    from.replaceWith(to)
  }

  return to
}

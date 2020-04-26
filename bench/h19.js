import v from '../v.js'
import htm from 'xhtm/index.js'
import { symbol, observable, primitive, object, input } from '../util.js'

const _group = Symbol.for('@spect.group'),
      _ptr = Symbol.for('@spect.ptr'),
      _props = Symbol.for('@spect.props'),
      _children = Symbol.for('@spect.children')

const TEXT = 3, ELEMENT = 1


export function html (...args) {
  let result = htm.apply(h, args)
  if (!result) return document.createTextNode('')
  let container = []
  container.childNodes = container
  container.appendChild = el => container.push(el)

  render(Array.isArray(result) ? result : [result], container)

  return container.length > 1 ? container : container[0]
}

export default function h(tag, ...children) {
  // h`...content`
  if (tag.raw) return html(...arguments)

  // h(tag, child1, child2)
  const props = object(children[0]) || children[0] == null ? children.shift() || {} : {}

  let el

  // element
  if (typeof tag === 'string') {
    if (!tag) el = document.createDocumentFragment()
    else {
      let [beforeId, afterId = ''] = tag.split('#')
      let beforeClx = beforeId.split('.')
      tag = beforeClx.shift()
      let afterClx = afterId.split('.')
      let id = afterClx.shift()
      let clx = [...beforeClx, ...afterClx]
      if (!props.id && id) props.id = id
      if (!props.class && clx.length) props.class = clx
      el = document.createElement(tag)
    }
  }
  else if (typeof tag === 'function') {
    el = nodify(tag(props))
  }
  else el = nodify(tag)

  // element
  if (el.nodeType === ELEMENT) {
    // props (dynamic)
    el[_props] = v(() => props)
    el[_props]((props) => {
      let vprop
      for (let name in props) {
        let value = props[name]
        if (observable(value)) {
          vprop = v(value, value => (
            el[name] = value,
            setAttribute(el, name, value)
          ))
        }
        else if (Array.isArray(value) || object(value)) {
          el[name] = value
          vprop = v(value, value => setAttribute(el, name, value))
        }
        else {
          el[name] = value
          setAttribute(el, name, value)
        }
      }
      return () => vprop && vprop[symbol.dispose]()
    })

    // children
    if (children.length) render(children, el)
  }
  // text
  else if (el.nodeType === TEXT) {}
  // fragment
  else {
    if (children.length) render(children, el)
  }

  return el
}

export function render(children, el) {
  // clean up prev observers
  if (el[_children]) el[_children][symbol.dispose]()
  el[_children] = v(() => children)

  el[_ptr] = 0

  const cur = []
  el[_children](children => {
    children.map((child, i) => {
      if (cur[i] === child) return
      cur[i] = !cur[i] ? alloc(el, nodify(child)) : replaceWith(cur[i], nodify(child))
      // if sync init did not hit - create placeholder, no hydration possible
      if (!cur[i]) cur[i] = alloc(el, nodify(''))

      // clear placeholder content
      if (cur[i][_group]) cur[i].textContent = ''
    })
  })

  // trim unused nodes
  while(el.childNodes[el[_ptr]]) {
    let child = el.childNodes[el[_ptr]]
    if (child[_props]) (child[_props][symbol.dispose](), delete child[_props])
    child.remove()
  }
}

function nodify(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) return document.createTextNode(arg)

  // can be node/fragment
  // reset pointer - the element is considered re-allocatable
  if (arg.nodeType) return arg

  // can be an array / array-like
  if (arg[Symbol.iterator]) {
    let marker = document.createTextNode('')
    marker[_group] = [...arg].flat().map(arg => nodify(arg))
    // create placeholder content (will be ignored by ops)
    marker.textContent = marker[_group].map(n => n.textContent).join('')
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
    // same node
    if (
      node === el
      || (node.isSameNode && node.isSameNode(el))

      || (node.tagName === el.tagName && (
        // same-key node
        (node.id && (node.id === el.id))

        // same-content text node
        || (node.nodeType === TEXT && node.nodeValue === el.nodeValue && !node[_group])

        // just blank-ish tag matching by signature and no need morphing
        || (node.nodeType === ELEMENT && !node.id && !el.id && !node.name && !node.childNodes.length)
      ))
    ) {
      match = node
      // migrate props (triggers fx that mutates them)
      if (el !== match && el[_props] && match[_props]) {
        match[_props](el[_props]())
        el[_props][symbol.dispose]()
        delete el[_props]
      }
      render([...el.childNodes], match)
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
  if (el[_group]) {
    el[_group].map(el => parent.appendChild(el))
  }
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

function getAttribute (el, name, value) { return (value = el.getAttribute(name)) === '' ? true : value }

function setAttribute (el, name, value) {
  if (value === false || value == null) {
    el.removeAttribute(name)
  }
  // class=[a, b, ...c] - possib observables
  else if (Array.isArray(value)) {
    el.setAttribute(name, value.filter(Boolean).join(' '))
  }
  // style={}
  else if (object(value)) {
    let values = Object.values(value)
    el.setAttribute(name, Object.keys(value).map((key, i) => `${key}: ${values[i]};`).join(' '))
  }
  // onclick={} - just ignore
  else if (typeof value === 'function') {}
  else {
    el.setAttribute(name, value === true ? '' : value)
  }
}

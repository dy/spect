import v, { observable, primitive, object } from './v.js'
import o from './o.js'
import _observable from 'symbol-observable'
import htm from 'xhtm/index.js'

const _group = Symbol.for('@spect.group'),
      _ptr = Symbol.for('@spect.ptr'),
      _props = Symbol.for('@spect.props'),
      _cleanup = Symbol.for('@spect.cleanup'),
      _channel = Symbol.for('@spect.channel')

const TEXT = 3, ELEMENT = 1


export function html (...args) {
  let result = htm.apply(h, args)

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
  else if (typeof tag === 'function') el = createChild(tag(props))
  else el = createChild(tag)

  el[_channel] = v()
  el[_channel].set(el)
  el[_observable] = () => el[_channel]

  // props (dynamic)
  if (el.nodeType === ELEMENT) {
    const realProps = o(el)
    el[_props] = v(props)
    el[_props](props => {
      Object.assign( realProps, props )
      el[_channel].set(el)
    })
    el[_channel].subscribe(null, null, () => el[_props].cancel())
  }

  // children
  render(children, el)

  return el
}

export function render(children, el) {
  el[_ptr] = 0

  // clean up prev observers
  if (el[_cleanup]) el[_cleanup].map(obv => obv.cancel())
  el[_cleanup] = []

  children.map((child) => {
    if (observable(child)) {
      let cur, oChild = v(child)
      el[_cleanup].push(oChild)
      oChild(child => {
        cur = !cur ? alloc(el, createChild(child)) : replaceWith(cur, createChild(child))
        if (el[_channel]) el[_channel].set(el)
      })
      // if sync init did not hit - create placeholder, no hydration possible
      if (!cur) {
        alloc(el, createChild(''))
        if (el[_channel]) el[_channel].set(el)
      }
    }
    else {
      alloc(el, createChild(child))
    }
  })

  // trim unused nodes
  while(el.childNodes[el[_ptr]]) el.childNodes[el[_ptr]].remove()
}

function createChild(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) return document.createTextNode(arg)

  // can be node/fragment
  // reset pointer - the element is considered re-allocatable
  if (arg.nodeType) return arg

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
    // same node
    if (node === el
      || (node.isSameNode && node.isSameNode(el))
      || (node[_group] && el[_group])
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
      if (el[_props] && match[_props] && el !== match) match[_props].set(el[_props]())
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

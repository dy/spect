import v, { observable, primitive, object, input } from './v.js'
import * as symbol from './symbols.js'

const _group = Symbol.for('@spect.group'),
      _ptr = Symbol.for('@spect.ptr'),
      _props = Symbol.for('@spect.props'),
      _children = Symbol.for('@spect.children')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const tplCache = {}

const PLACEHOLDER = 'h:::'

export default function h (statics, ...fields) {
  // hyperscript - turn to tpl literal call
  if (!statics.raw) {
    // h(tag, ...children)
    if (!object(fields[0]) && fields[0] != null) fields.push(null)

    statics = [
      ...(primitive(statics) ? [`<${statics} ...`] : ['<', ' ...']),
      ...(!fields.length ? ['/>'] : ['>', ...Array(fields.length - 1).fill(''), '</>'])
    ]
  }

  const key = statics.join(PLACEHOLDER)
  const tpl = tplCache[key] || (tplCache[key] = createTpl(statics))

  let node = tpl.content.cloneNode(true)

  return evaluate(node, fields)
}

function createTpl(statics) {
  let c = 0
  const tpl = document.createElement('template')
  tpl.innerHTML = statics.join(PLACEHOLDER).replace(/h:::/g, m => m + c++)

  const walker = document.createTreeWalker(tpl.content, SHOW_TEXT | SHOW_ELEMENT, null), split = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === TEXT) {
      let curr = []
      node.data.replace(/h:::\d+/g, (m, idx) => {
        curr.push(idx, idx + m.length)
      })
      if (curr.length) split.push(node, curr)
    }
    else {
      for (let i = 0, n = node.attributes.length; i < n; i++) {
        let {name, value} = node.attributes[i]
        // <a ...${x} → <a ${x}
        if (/^\.\.\./.test(name)) {
          node.removeAttribute(name), --i, --n;
          node.setAttribute(name.slice(3), value)
        }
      }
    }
  }
  for (let i = 0; i < split.length; i+= 2) {
    let node = split[i], idx = split[i + 1], prev = 0
    idx.map(id => (node = node.splitText(id - prev), prev = id))
  }

  return tpl
}

// evaluate template element with fields
function evaluate (frag, fields) {
  const field = str => fields[+str.slice(4)]

  const walker = document.createTreeWalker(frag, SHOW_ELEMENT | SHOW_TEXT, null)

  const replace = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    const attributes = node.attributes;
    if (node.nodeType === ELEMENT) {
      console.log(node.outerHTML)

      for (let i = 0, n = attributes.length; i < n; ++i) {
        let {name, value} = attributes[i];
        // <a a=${b}
        if (/^h:::/.test(value)) {
          value = field(value)
        }
        // <a ${a}=b
        if (/^h:::/.test(name)) {
          --i, --n
          node.removeAttribute(name)
          name = field(name)
        }
        // <a ${{a:b}}, <a ...${{a:b}}
        if (object(name) || observable(name) || observable(value)) {
          v([name, value])(([name, value]) => {
            const keys = object(name) ? Object.keys(name) : [name], props = object(name) ? name : {[name]: value}
            keys.map(prop => setAttribute(node, prop, node[prop] = props[prop]))
            return () => keys.map(prop => (delete node[prop], node.removeAttribute(prop)))
          })
        }
        else setAttribute(node, name, node[name] = value)
      }
    }
    else if (node.nodeType === TEXT) {
      if (/^h:::/.test(node.data)) replace.push(node, nodify(fields[+node.data.slice(4)]))
    }
  }
  while (replace.length) {
    replace.shift().replaceWith(replace.shift())
  }

  return frag.childNodes.length > 1 ? frag.childNodes : frag.firstChild
}












/*

export function html (statics, ...fields) {
  let result = htm.apply(h, arguments)
  if (!result) return document.createTextNode('')

  let container = []
  container.childNodes = container
  container.appendChild = el => container.push(el)

  render(Array.isArray(result) ? result : [result], container)

  return container.length > 1 ? container : container[0]
}


export function h(tag, ...children) {
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
  el[_children] = v(children.map((child) => {
    // ignore input el
    if (input(child)) {
      let el = v()
      el(child)
      return el
    }
    return child
  }))

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
*/

function nodify(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) return document.createTextNode(arg)

  // can be node/fragment
  // reset pointer - the element is considered re-allocatable
  if (arg.nodeType) return arg

  // can be an array / array-like
  if (arg[Symbol.iterator]) {
    // FIXME: replace with comment
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

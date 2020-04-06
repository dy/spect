import v, { observable, primitive, object, input } from './v.js'
import * as symbol from './symbols.js'

const _group = Symbol.for('@spect.group'),
      _ptr = Symbol.for('@spect.ptr'),
      _props = Symbol.for('@spect.props'),
      _children = Symbol.for('@spect.children')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const tplCache = {}

const PLACEHOLDER = 'h:::'
const id = str => +str.slice(4)

export default function h (statics, ...fields) {
  // hyperscript - turn to tpl literal call
  if (!statics.raw) {
    // h(tag, ...children)
    if (!fields.length || !object(fields[0]) && fields[0] != null) fields.unshift(null)
    const count = fields.length
    if (!primitive(statics)) fields.unshift(statics)

    statics = [
      ...(primitive(statics) ? [`<${statics} ...`] : ['<', ' ...']),
      ...(count < 2 ? [`/>`] : ['>', ...Array(count - 2).fill(''), `</>`])
    ]
  }

  const key = statics.join(PLACEHOLDER + '_')
  const tpl = tplCache[key] || (tplCache[key] = createTpl(key))

  let frag = tpl.content.cloneNode(true)
  evaluate(frag, fields)
  return frag.childNodes.length > 1 ? frag.childNodes : frag.firstChild
}

function createTpl(str) {
  let c = 0
  const tpl = document.createElement('template')

  // ref: https://github.com/developit/htm/blob/26bdff2306dd77dcf82a2d788a8d3e689968b0da/src/index.mjs#L36-L40
  tpl.innerHTML = str
    // <a h:::_ → <a h:::1
    .replace(/h:::_/g, m => PLACEHOLDER + c++)
    // <abc .../> → <abc ...></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <h:::_ → <h::: _=3
    .replace(/<h:::(\d+)/g, '<h::: _=$1')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</h:::>')
    // .../> → ... />
    // .replace(/([^<\s])\/>/g, '$1 />')

  const walker = document.createTreeWalker(tpl.content, SHOW_TEXT | SHOW_ELEMENT, null), split = [], replace = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (node.nodeType === TEXT) {
      let curr = [], last = 0
      node.data.replace(/h:::\d+/g, (m, idx, str) => {
        if (idx && idx !== last) curr.push(idx)
        if (idx + m.length < str.length) curr.push(last = idx + m.length)
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

      if (/#|\./.test(node.tagName)) {
        let tag = node.localName // preserves case sensitivity
        let [beforeId, afterId = ''] = tag.split('#')
        let beforeClx = beforeId.split('.')
        tag = beforeClx.shift()
        let afterClx = afterId.split('.')
        let id = afterClx.shift()
        let clx = [...beforeClx, ...afterClx]
        if (!node.id && id) node.id = id
        if (clx.length) clx.map(cls => node.classList.add(cls))
        tag = document.createElement(tag)
        replace.push(node, tag)
      }
    }
  }

  while (replace.length) {
    let from = replace.shift(), to = replace.shift()
    replaceWith(from, to)
    for (let {name, value} of from.attributes) to.setAttribute(name, value)
    to.append(...from.childNodes)
  }

  for (let i = 0; i < split.length; i+= 2) {
    let node = split[i], idx = split[i + 1], prev = 0, l = node.wholeText.length
    idx.map(id => (node = node.splitText(id - prev), prev = id))
  }

  return tpl
}

// evaluate template element with fields
function evaluate (node, fields) {
  const ox = []

  // create element state observables
  let props, children

  if (node.attributes) {
    const attributes = node.attributes

    props = v(() => ({}))

    // recurse loop does not iterate over newly inserted nodes, unlike treeWalker/nodeIterator
    for (let i = 0, n = attributes.length; i < n; ++i) {
      let {name, value} = attributes[i];
      if (/^_/.test(name)) continue

      // <a a=${b}
      if (/^h:::/.test(value)) {
        value = fields[id(value)]
      }
      // <a ${a}=b
      if (/^h:::/.test(name)) {
        --i, --n
        node.removeAttribute(name)
        name = fields[id(name)]
      }
      // <a ${{a:b}}, <a ...${{a:b}}
      if (object(name)) {
        (ox[ox.length] = v(name))
        ((values, diff) => props({...props(), ...values}, diff))
      }
      else if (observable(name) || observable(value)) {
        (ox[ox.length] = v([name, value]))(([name, value]) => {
          props()[name] = value
          props(props(), {[name]: value})
          return () => props({...props(), [name]:null}, {[name]: null})
        })
      }
      else if (name != null) props({...props(), [name]: value}, {[name]: value})
    }
  }

  if (node.childNodes && node.childNodes.length) {
    children = v(Array(node.childNodes.length))

    node.childNodes.forEach((child, i) => {
      if (child.nodeType === TEXT) {
        if (/^h:::/.test(child.data)) {
          child = fields[id(child.data)]

          if (observable(child) || (child && (child.forEach || child.item))) {
            (ox[ox.length] = v(child))
            (child => children({[i]: nodify(child)}))
          }
          else {
            children({[i]: nodify(child)})
          }
        }
        else children({[i]: child})
      }
      else {
        children({[i]: evaluate(child, fields)})
      }
    })
  }

  // <${tag}
  if (node.tagName && node.tagName.toLowerCase() === PLACEHOLDER) {
    const tag = fields[+node.getAttribute('_')]
    if (observable(tag)) {
      (ox[ox.length] = v(tag))
      (newNode => {
        newNode = nodify(newNode)
        if (same(newNode, node)) return
        newNode.append(...node.childNodes)
        node.replaceWith(node = newNode)
        const values = props()
        for (let name in values) setAttribute(node, name, newNode[name] = values[name])
      })
    }
    else if (typeof tag === 'function') {
      node.replaceWith(node = nodify(tag({ children: children(), ...props() })))
    }
  }

  // deploy observables
  if (props) props((all, changed) => {
    let keys = Object.keys(changed)
    keys.map(name => setAttribute(node, name, node[name] = changed[name]))
    return () => keys.map(name => (delete node[name], node.removeAttribute(name)))
  })
  if (children) {
    const cur = []
    children((all, changed) => {
      const idx = Object.keys(changed)
      idx.map(id => cur[id] = !cur[id] ? alloc(node, changed[id]) : replaceWith(cur[id], changed[id]))
    })

    // trim unused nodes
    while(node.childNodes[node[_ptr]]) {
      let child = node.childNodes[node[_ptr]]
      if (child[_props]) (child[_props][symbol.dispose](), delete child[_props])
      child.remove()
    }
  }

  return node
}

function nodify(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) return document.createTextNode(arg)

  // can be node/fragment
  if (arg.nodeType) return arg

  // can be an array / array-like
  if (arg[Symbol.iterator]) {
    let marker = document.createTextNode('')
    marker[_group] = [...arg].flat().map(arg => nodify(arg))
    // create placeholder content (will be ignored by ops)
    // marker.textContent = marker[_group].map(n => n.textContent).join('')
    return marker
  }

  return arg
}

// locate/allocate node[s] in element
function alloc(parent, el) {
  if (!parent) return el

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
    if (same(node, el)) {
      match = node
      // bring over props/children from blueprint el to found real node
      for (let {name, value} of el.attributes) match.setAttribute(name, value)
      match.append(...el.childNodes)

      if (el[_props]) el[_props][symbol.dispose]()
      if (el[_children]) el[_children][symbol.dispose]()
      // migrate props (triggers fx that mutates them)
      // if (el !== match && el[_props] && match[_props]) {
      //   match[_props](el[_props]())
      //   delete el[_props]
      // }
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

function same(a, b) {
  return a === b
  || (a.isSameNode && a.isSameNode(b))
  // same-content text node
  || (a.nodeType === TEXT && a.data === b.data && !a[_group] && !b[_group])
  || (a.tagName === b.tagName && (
    // same-key node
    (a.id && (a.id === b.id))
    // just blank-ish tag matching by signature and no need morphing
    || (a.nodeType === ELEMENT && !a.id && !b.id && !a.name && !a.childNodes.length)
  ))
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
  // test nodes etc
  if (!el || !el.setAttribute) return

  if (value === false || value == null) el.removeAttribute(name)
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

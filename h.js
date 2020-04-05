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
  frag.childNodes.forEach(node => evaluate(node, fields))
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
  if (node.nodeType === TEXT) {
    if (/^h:::/.test(node.data)) node.replaceWith(node = nodify(node = fields[id(node.data)]))
    return node
  }

  const attributes = node.attributes
  if (!attributes) return node

  // dispose previous observers
  if (node[_props]) node[_props][symbol.dispose]()

  // evaluate props
  const vprops = node[_props] = v(() => ({})), props = vprops()

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
      v(name, values => {
        const keys = Object.keys(values)
        keys.map(name => props[name] = values[name])
        vprops(props)
        return () => keys.map(name => delete props[name])
      })
    }
    else if (observable(name) || observable(value)) {
      v([name, value])(([name, value]) => {
        props[name] = value
        vprops(props)
        return () => delete props[name]
      })
    }
    else if (name != null) props[name] = value
  }

  const children = [].map.call(node.childNodes, node => evaluate(node, fields))

  // <${tag}
  if (node.tagName.toLowerCase() === PLACEHOLDER) {
    const tag = fields[+node.getAttribute('_')]
    node = replaceWith(node, nodify(typeof tag === 'function' ? tag({ children, ...props }) : tag))
  }

  // merge blueprint scheme children to real ones, make them live
  render(children, node)

  vprops(props => {
    const keys = Object.keys(props)
    keys.map(prop => node[prop] !== props[prop] && setAttribute(node, prop, node[prop] = props[prop]))
    return () => keys.map(prop => (delete node[prop], node.removeAttribute(prop)))
  })

  return node
}

// patch existing element children with the new blueprint children
export function render(children, el) {
  // clean up prev observers
  if (el[_children]) el[_children][symbol.dispose]()
  el[_children] = v(children)
  el[_ptr] = 0

  const cur = []
  el[_children](children => {
    children.map((child, i) => {
      if (cur[i] === child) return
      // observables may receive non-node values, so need to nodify
      child = nodify(child)
      cur[i] = !cur[i] ? alloc(el, child) : replaceWith(cur[i], child)
      // if sync init did not hit - create placeholder, no hydration possible
      // if (!cur[i]) cur[i] = alloc(el, nodify(''))

      // clear placeholder content
      // if (cur[i][_group]) cur[i].textContent = ''
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

import v, { observable, primitive, object, input } from './v.js'
import * as symbol from './symbols.js'

const _group = Symbol.for('@spect.group')
const _ref = Symbol.for('@spect.ref')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

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

  // return document fragment because 1-st level observables may update themselves
  let frag = tpl.content.cloneNode(true)
  evaluate(frag, fields)
  return frag.childNodes.length === 1 ? frag.firstChild[_ref] || frag.firstChild : frag
}

function createTpl(str) {
  let c = 0
  const tpl = document.createElement('template')

  // ref: https://github.com/developit/htm/blob/26bdff2306dd77dcf82a2d788a8d3e689968b0da/src/index.mjs#L36-L40
  str = str
    // <a h:::_ → <a h:::1
    .replace(/h:::_/g, m => PLACEHOLDER + c++)
    // <h:::_ → <h::: _=3
    .replace(/<h:::(\d+)/g, '<h::: _=$1')
    // <> → <h:::>
    .replace(/<(>|\s)/,'<h:::$1')
    // <abc .../> → <abc ...></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</h:::>')
    // .../> → ... />
    // .replace(/([^<\s])\/>/g, '$1 />')
  tpl.innerHTML = str

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

function field(id, fields) {
  let vals = id.split('h:::').slice(1).map(id => fields[id])
  return vals.length > 1 ? vals : vals[0]
}

// evaluate template element with fields
function evaluate (node, fields) {
  const vx = []

  let props, children

  // parse attrs from blueprint node
  if (node.attributes) {
    const attributes = node.attributes

    props = v(() => ({}))

    // recurse loop does not iterate over newly inserted nodes, unlike treeWalker/nodeIterator
    for (let i = 0, n = attributes.length; i < n; ++i) {
      let {name, value} = attributes[i];
      if (/^_/.test(name)) continue

      // <a a=${b}
      if (/^h:::/.test(value)) {
        value = field(value, fields)
      }
      // <a ${a}=b
      if (/^h:::/.test(name)) {
        --i, --n
        node.removeAttribute(name)
        name = field(name, fields)
      }
      // <a ${{a:b}}, <a ...${{a:b}}
      if (object(name)) {
        (vx[vx.length] = v(name))
        ((values, diff) => props({...props(), ...values}, diff))
      }
      else if (observable(name) || observable(value)) {
        (vx[vx.length] = v([name, value]))(([name, value]) => {
          props()[name] = value
          props(props(), {[name]: value})
          return () => props({...props(), [name]:null}, {[name]: null})
        })
      }
      else if (name != null) {
        props({...props(), [name]: value}, {[name]: value})
      }
    }
  }

  if (node.childNodes && node.childNodes.length) {
    children = v(Array(node.childNodes.length))

    ;[...node.childNodes].forEach((child, i) => {
      child.remove()
      if (child.nodeType === TEXT) {
        if (/^h:::/.test(child.data)) {
          child = field(child.data, fields)

          if (observable(child) || (child && (child.forEach || child.item))) {
            (vx[vx.length] = v(child))
            (child => children({[i]: nodify(child)}))
          }
          else {
            children({[i]: nodify(child)})
          }
        }
        else children({[i]: child})
      }
      else {
        child = evaluate(child, fields)
        // h`<a><${b}/></a>` removes b from its own parent and inserts to a
        // h`<${b}/>` keeps b in its own parent
        children({[i]: node.nodeType === FRAGMENT ? child : child[_ref] || child})
      }
    })
  }

  // <${tag} - mount to target (off-current tree) or insert string
  if (node.tagName && node.tagName.toLowerCase() === PLACEHOLDER) {
    const tag = node.hasAttribute('_') ? fields[+node.getAttribute('_')] : document.createDocumentFragment()

    // clear up rendered tag props/children
    if (tag.nodeType) {
      if (tag[symbol.dispose]) ( tag[symbol.dispose](), delete tag[symbol.dispose] )
      while (tag.childNodes.length) {
        if (tag.firstChild[symbol.dispose]) (tag.firstChild[symbol.dispose](), delete tag.firstChild[symbol.dispose])
        tag.firstChild.remove()
      }
      node = tag
      // make parent insert placeholder - internal portals are transfered, external portals are kept unchanged
      // h`<a><${b}/></a>` - b is placed to a
      // h`<${b}/>` - b is kept in its own parent
      ;(node[_ref] = document.createTextNode(''))[_ref] = node
    }
    else if (typeof tag === 'function') {
      v([props, children], ([props, children]) => node = replaceWith(node, nodify(tag({...props, children}))))
      return node
    }
    else {
      node = nodify(tag)
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
      idx.map(id => cur[id] = !cur[id] ? appendChild(node, changed[id]) : replaceWith(cur[id], changed[id]))
    })
  }

  if (node[symbol.dispose]) throw Error('Redefining defined node')
  node[symbol.dispose] = () => (
    vx.map(v => v[symbol.dispose]()),
    children && children[symbol.dispose](),
    props && props[symbol.dispose]()
  )

  return node[_ref] || node
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

function appendChild(parent, el) {
  parent.appendChild(el)
  if (el[_group]) el[_group].map(el => appendChild(parent, el))
  return el
}

function replaceWith(from, to) {
  if (from === to) return to

  if (from[_group]) from[_group].map(el => el.remove())
  if (from[symbol.dispose]) from[symbol.dispose]()

  if (to[_group]) {
    let frag = document.createDocumentFragment()
    appendChild(frag, to)
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

import { symbol, observable, primitive, attr, esc } from './src/util.js'
import htm from 'htm'

// DOM
const TEXT = 3, ELEM = 1, ATTR = 2, COMM = 8, FRAG = 11, COMP = 6,
      SHOW_ELEMENT = 1, SHOW_TEXT = 4, SHOW_COMMENT = 128

// placeholders
const ZWSP = '\u200B', ZWNJ = '\u200C', ZWJ = '\u200D', H_TAG = 'slot', H_FIELD = ZWNJ

// character for node id, ref https://mathiasbynens.be/notes/html5-id-class
// const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// see also https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
// const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')

const cache = new WeakMap

const html = htm.bind(h)
export default function (statics) {
  if (!Array.isArray(statics)) return h(...arguments)

  let result = html(...arguments)

  return primitive(result) ? document.createTextNode(result == null ? '' : result) :
        Array.isArray(result) ? h(document.createDocumentFragment(), null, ...result) :
        result
}

// hyperscript
export function h(tag, props, ...children) {
  if (typeof tag === 'string') {
    // hyperscript-compat
    if (/#|\./.test(tag)) {
      let id, cls
      [tag, id] = tag.split('#')
      if (id) [id, ...cls] = id.split('.')
      else [tag, ...cls] = tag.split('.')
      if (id || cls.length) {
        props = props || {}
        if (id) props.id = id
        if (cls.length) props.class = cls
      }
    }
    tag = document.createElement(tag)
  }
  else if (typeof tag === 'function') {
    tag = tag({children, ...props})
    // FIXME: is there a more elegant way?
    if (Array.isArray(tag)) {
      let frag = document.createDocumentFragment()
      frag.append(...tag)
      tag = frag
    }
    // component is completed - no need to post-merge children/props
    return tag
  }
  // clean up previous observables
  else if (tag._cleanup) { for (let fn of tag._cleanup) fn(); tag._cleanup = null }

  // apply props
  let cleanup = [], subs, i
  for (let name in props) {
    let value = props[name]
    // FIXME: tweak own compiler
    if (typeof value === 'string') value = value.replace(/false|null|undefined/g,'')

    // primitive is more probable also less expensive than observable check
    if (primitive(value)) attr(tag, name, value)
    else if (observable(value)) cleanup.push(sube(value, v => attr(tag, name, v)))
    else attr(tag, name, value)
  }

  // detect observables
  for (i = 0; i < children.length; i++)
    if (observable(children[i])) cleanup.push((subs || (subs = []))[i] = children[i]), children[i] = document.createTextNode('')

  // append shortcut
  if (!tag.childNodes.length) for (i of flat(children)) tag.append(i)
  else merge(tag, tag.childNodes, flat(children))

  if (subs) subs.map((sub, i) => sube(sub, child => (
    children[i] = child,
    merge(tag, tag.childNodes, flat(children))
  )))

  if (cleanup.length) tag._cleanup = cleanup

  return tag
}

const flat = (children) => {
  let out = [], i = 0, item
  for (; i < children.length;) {
    if ((item = children[i++]) != null) {
      if (primitive(item) || item.nodeType) out.push(item)
      else if (item[Symbol.iterator]) for (item of item) out.push(item)
    }
  }
  return out
}

// lil subscriby (v-less)
function sube(target, fn) {
  let unsub, stop
  if (typeof target === 'function') unsub = target(fn)
  else if (target[symbol.observable]) unsub = target[symbol.observable]().subscribe({next:fn})
  else if (target[Symbol.asyncIterator]) {
    unsub = () => stop = true
    ;(async () => { for await (target of target) { if (stop) break; fn(target) } })()
  }
  return unsub
}

// FIXME: make same-key morph for faster updates
// FIXME: modifying prev key can also make it faster
const same = (a, b) => a === b || (a && b && a.nodeType === TEXT && b.nodeType === TEXT && a.data === b.data)

// source: src/diff-inflate.js
const merge = (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n = b.length, m = a.length

  // skip head/tail
  while (i < n && i < m && same(a[i], b[i])) i++
  while (i < n && i < m && same(b[n-1], a[m-1])) end = b[--m, --n]

  // append/prepend shortcut
  if (i == m) while (i < n) insert(parent, b[i++], end)

  else {
    cur = a[i]

    while (i < n) {
      bi = b[i++], next = cur ? cur.nextSibling : end

      // skip
      if (same(cur, bi)) cur = next

      // swap / replace
      else if (i < n && same(b[i], next)) (replace(parent, cur, bi), cur = next)

      // insert
      else insert(parent, bi, cur)
    }

    // remove tail
    while (cur != end) (next = cur.nextSibling, parent.removeChild(cur), cur = next)
  }

  return b
}

const insert = (parent, a, b) => {
  if (a != null) {
    if (primitive(a)) parent.insertBefore(document.createTextNode(a), b)
    else parent.insertBefore(a, b)
  }
}

// note the order is different from replaceNode(new, old)
const replace = (parent, from, to, end) => {
  if (to != null) {
    if (primitive(to)) if (from.nodeType === TEXT) from.data = to; else from.replaceWith(to)
    else if (to.nodeType) parent.replaceChild(to, from)
    // FIXME: make sure no slice needed here
    else merge(parent, [from], to, end)
  }
}

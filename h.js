import { symbol, observable, primitive, attr, esc } from './src/util.js'
import htm from 'htm'

// DOM
const TEXT = 3, ELEM = 1, ATTR = 2, COMM = 8, FRAG = 11, COMP = 6,
      SHOW_ELEMENT = 1, SHOW_TEXT = 4, SHOW_COMMENT = 128

const cache = new WeakSet

const _cleanup = Symbol('cleanup'), _static = Symbol('static')

const ctx = {init:false}
export const h = hyperscript.bind(ctx)

export default function (statics) {
  if (!Array.isArray(statics)) return h(...arguments)

  // HTM caches nodes that don't have attr or children fields
  // eg. <a><b>${1}</b></a> - won't cache `a`,`b`, but <a>${1}<b/></a> - will cache `b`
  // for that purpose we first build template with blank fields, marking all fields as tpl
  // NOTE: static nodes caching is bound to htm.this (h) function, so can't substitute it
  // NOTE: we can't use first non-cached call result, because it serves as source for further cloning static nodes
  let result, count = 1
  if (!cache.has(statics)) count++, cache.add(statics)
  while (count--) {
    ctx.init = count ? true : false
    // init render may setup observables, which is undesirable - so we skip attributes
    result = htm.apply(h, arguments)
  }

  return primitive(result) ? document.createTextNode(result == null ? '' : result) :
        Array.isArray(result) ? h(document.createDocumentFragment(), null, ...result) :
        result[_static] ? result.cloneNode(true) : result
}

function hyperscript(tag, props, ...children) {
  const init = this.init
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

    // shortcut for faster creation, static nodes are really simple
    if (init) {
      tag[_static] = true
      for (let name in props) attr(tag, name, props[name])
      tag.append(...flat(children))
      return tag
    }
  }
  // init call is irrelevant for dynamic nodes
  else if (init) return
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
  else if (tag[_cleanup]) { for (let fn of tag[_cleanup]) fn(); tag[_cleanup] = null }

  // apply props
  let cleanup = [], subs, i, child
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
    if (child = children[i]) {
      // static nodes (cached by HTM) must be cloned, because h is not called for them more than once
      if (child[_static]) (children[i] = child.cloneNode(true))
      else if (observable(child)) cleanup.push((subs || (subs = []))[i] = child), child = document.createTextNode('')
    }

  // append shortcut
  if (!tag.childNodes.length) tag.append(...flat(children))
  else merge(tag, tag.childNodes, flat(children))

  if (subs) subs.map((sub, i) => sube(sub, child => (
    children[i] = child,
    merge(tag, tag.childNodes, flat(children))
  )))

  if (cleanup.length) tag[_cleanup] = cleanup

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

const insert = (parent, a, before) => {
  if (a != null) {
    if (primitive(a)) parent.insertBefore(document.createTextNode(a), before)
    else parent.insertBefore(a, before)
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

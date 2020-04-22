import { symbol, observable, primitive, object, immutable, list } from './util.js'

const _group = Symbol.for('@spect.group')
const _node = Symbol.for('@spect.node')
const _cleanup = Symbol.for('@spect.cleanup')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const buildCache = new WeakMap

const FIELD = 'h:::'
const id = str => +str.slice(FIELD.length)

export default function h (statics, ...fields) {
  // hyperscript - turn to tpl literal call
  // FIXME: there must be standard builder - creating that key is SLOW
  // FIXME: should be Array.isTemplateObject(statics)
  if (!statics.raw) {
  //   // h(tag, ...children)
  //   if (!fields.length || !object(fields[0]) && fields[0] != null) fields.unshift(null)
  //   const count = fields.length
  //   if (!primitive(statics)) fields.unshift(statics)

  //   statics = [
  //     ...(primitive(statics) ? [`<${statics} ...`] : ['<', ' ...']),
  //     ...(count < 2 ? [`/>`] : ['>', ...Array(count - 2).fill(''), `</>`])
  //   ]
  // }
  }

  let build = buildCache.get(statics)

  if (!build) {
    const key = statics.join(FIELD + '_')
    build = createBuilder(key)
    buildCache.set(statics, build)
  }

  return build(...fields)
}

// FIXME: fields numeration is not required - it is co-directional with walking template elements, so field number can simply be incremented
// that by shaving off bunch of these regexps

function createBuilder(str) {
  let c = 0
  const tpl = document.createElement('template')

  // ref: https://github.com/developit/htm/blob/26bdff2306dd77dcf82a2d788a8d3e689968b0da/src/index.mjs#L36-L40
  str = str
    // <a h:::_ → <a h:::1
    .replace(/h:::_/g, m => FIELD + c++)
    // <h:::3 → <h::: _=3
    .replace(/<h:::(\d+)/g, '<h::: _=$1')
    // <> → <h:::>
    .replace(/<(>|\s)/,'<h:::$1')
    // <abc .../> → <abc ...></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</h:::>')
    // .../> → ... />
    // .replace(/([^<\s])\/>/g, '$1 />')
    // <a#b.c → <a #b.c
    .replace(/(<[\w:-]+)([#\.][^<>]*>)/g, '$1 $2')
  tpl.innerHTML = str

  // normalize template tree
  let normWalker = document.createTreeWalker(tpl.content, SHOW_TEXT | SHOW_ELEMENT, null), split = [], node
  while (node = normWalker.nextNode()) {
    // child fields into separate text nodes
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
        // <a #b.c
        else if (/#|\./.test(name)) {
          node.removeAttribute(name), --i, --n;
          let [beforeId, afterId = ''] = name.split('#')
          let beforeClx = beforeId.split('.')
          name = beforeClx.shift()
          let afterClx = afterId.split('.')
          let id = afterClx.shift()
          let clx = [...beforeClx, ...afterClx]
          if (!node.id && id) node.id = id
          if (clx.length) clx.map(cls => node.classList.add(cls))
        }
      }
    }
  }
  for (let i = 0; i < split.length; i+= 2) {
    let node = split[i], idx = split[i + 1], prev = 0
    idx.map(id => (node = node.splitText(id - prev), prev = id))
  }

  // a h:::1 b → a <h::: _=1/> b
  let insertWalker = document.createTreeWalker(tpl.content, SHOW_TEXT, null), replace = [], textNode
  while (textNode = insertWalker.nextNode()) {
    if (/^h:::/.test(textNode.data)) {
      const node = document.createElement('h:::')
      node.setAttribute('_', id(textNode.data))
      replace.push([textNode, node])
    }
  }
  replace.forEach(([from, to]) => from.replaceWith(to))

  // create field evaluators - for each field they make corresponding transformation to [cloned] template
  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const evals = [], tplNodes = tpl.content.querySelectorAll('*')
  for (let tplNode, fieldId = 0, nodeId = 0; tplNode = tplNodes[nodeId]; nodeId++) {
    if (tplNode.localName === FIELD) {
      // <${node} _=N, <>${n}</> - will be replaced as new node
      const i = fieldId, j = nodeId
      evals[fieldId++] = function tag(arg) {
        const node = this.nodes[j]
        if (observable(arg)) this.cleanup.push(sube(arg, tag => {
          node[_node] = updateNode(node[_node] || node, tag)
        }))
        else node[_node] = updateNode(node, arg)
      }
    }

    for (let n = 0, m = tplNode.attributes.length; n < m; n++) {
      let { name, value } = tplNode.attributes[n]

      // fields are co-directional with attributes and nodes order, so we just increment fieldId (also healthy insertions!)
      // fields accept generic observables, not bound to spect/v
      // FIXME: can simply compare name === FIELD
      // <a ${{}}, <a ${'hidden'}
      if (name.includes(FIELD)) {
        tplNode.removeAttribute(name), n--, m--
        const j = nodeId
        evals[fieldId++] = function (arg) {
          const node = this.nodes[j][_node] || this.nodes[j]
          if (primitive(arg)) prop(node, arg, value)
          // can only be object observable
          else if (observable(arg)) {
            this.cleanup.push(sube(arg, v => {
              if (primitive(v)) (prop(node, v, value))
              else for (let key in v) prop(node, key, v[key])
            }))
          }
          else for (let key in name) prop(node, key, name[key])
        }
      }
      else if (value.includes(FIELD)) {
        const j = nodeId
        // <a a=${b}
        // FIXME: just compare
        // if (value === FIELD) {
        if (/^h:::\d+$/.test(value)) {
          evals[fieldId++] = function (arg) {
            const node = this.nodes[j][_node] || this.nodes[j]
            observable(arg) ? this.cleanup.push(sube(arg, v => prop(node, name, v))) : prop(node, name, arg)
          }
        }
        // <a a="b${c}d${e}f"
        else {
          const statics = value.split(/h:::\d+/)
          const evalFields = function (...fields) {
            const node = this.nodes[j][_node] || this.nodes[j]
            let subs = fields.map((field, i) => observable(field) ? (fields[i] = '', field) : null)
            prop(node, name, h.tpl(statics, ...fields))
            subs.forEach((sub, i) => sub && this.cleanup.push(sube(sub, v => (fields[i] = v, prop(node, name, h.tpl(statics, ...fields))))))
          }
          evalFields.count = statics.length - 1
          evals[fieldId++] = evalFields
        }
      }
    }
  }

  function build() {
    let ctx = { root: tpl.content, nodes: tplNodes, cleanup: [], clone: false }

    // primitive fields modify tpl directly, then clone it (fast!)
    const clone = () => {
      ctx.root = tpl.content.cloneNode(true)
      // https://jsperf.com/getelementsbyclassname-vs-queryselectorall/236 - the fastest for static selectors
      ctx.nodes = ctx.root.querySelectorAll('*')
      ctx.clone = true
    }

    for (let i = 0; i < arguments.length;) {
      const evalField = evals[i]
      if (evalField.count) {
        const fields = [].slice.call(arguments, i, i += evalField.count)
        fields.forEach(field => (!ctx.clone && observable(field)) && clone())
        evalField.apply(ctx, fields)
      }
      else {
        const field = arguments[i++]
        if (!ctx.clone && (!primitive(field) || evalField.name === 'tag')) clone()
        evalField.call(ctx, field)
      }
    }

    if (!ctx.clone) ctx.root = tpl.content.cloneNode(true)
    return ctx.root.childNodes.length > 1 ? ctx.root : ctx.root.firstChild
  }

  return build
}

// interpolator
h.tpl = (statics, ...fields) => String.raw({raw: statics}, ...fields.map(value => value == null ? '' : value))

// lil subscriby (v-less)
function sube(target, fn, unsub) {
  if (typeof target === 'function') unsub = target(fn)
  else if (target[symbol.observable]) target[symbol.observable](({subscribe}) => unsub = subscribe({ next: fn }))
  else if (target[Symbol.asyncIterator]) {
    let stop, unsub = () => stop = true
    ;(async () => { for await (let v of source) { if (stop) break; fn(v) } })()
  }
  return unsub
}

function prop (el, name, value=true) {
  // if (arguments.length < 3) return (value = el.getAttribute(name)) === '' ? true : value

  el[name] = value

  if (primitive(value)) {
    if (value === false || value == null) el.removeAttribute(name)
    else el.setAttribute(name, value === true ? '' : value)
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
}

function updateNode (from, to) {
  if (same(from, to)) return from

  // FIXME: special case when preserve parent childNodes
  // if (to === from.parentNode.childNodes) throw Error('Special case')

  // array / array-like
  if (list(to) || list(from)) {
    if (!list(from)) from = [from]
    if (!list(to)) to = [to]
    if (!to.length) to.push('')
    // FIXME: redundant-ish, since for text nodes merge follows
    to = to.map(item => immutable(item) ? document.createTextNode(item) : item)
    from = merge(from[0].parentNode, from, to)
  }
  // can be text/primitive
  else {
    from = morph(from, to)
  }

  return from
}

// FIXME: possible to shave off completely
function morph(from, to) {
  if (immutable(to)) {
    to = to == null ? '' : to
    if (from.nodeType === TEXT) from.data = to
    else from.replaceWith(from = document.createTextNode(to))
  }
  // can be node/fragment
  else if (to.nodeType) from.replaceWith(from = to)

  return from
}

// mergeable elements: text, named leaf input
const key = node => node.nodeType === TEXT ? node.data : node.name && !node.firstChild ? node.name : node
const same = (a, b) => a === b || (b && a && a.nodeType === b.nodeType && key(a) === key(b))

// ref: https://github.com/luwes/js-diff-benchmark/blob/master/libs/spect.js
export function merge (parent, a, b, end = null) {
  let bidx = new Set(b), aidx = new Set(a), i = 0, cur = a[0], next, bi

  while ((bi = b[i++]) || cur != end) {
    next = cur ? cur.nextSibling : end

    // skip
    if (same(cur, bi)) cur = next

    // insert has higher priority, inc. tail-append shortcut
    else if (bi && (cur == end || bidx.has(cur))) {
      // swap
      if (b[i] === next && aidx.has(bi)) cur = next

      // insert
      parent.insertBefore(bi, cur)
    }

    // technically redundant, but enables morphing text
    else if (bi && !aidx.has(bi)) {
      morph(cur, bi)
      // parent.replaceChild(bi, cur)
      cur = next
    }

    // remove
    else (parent.removeChild(cur), cur = next, i--)
  }

  return b
}

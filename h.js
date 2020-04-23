import { symbol, observable, primitive, object, immutable, list } from './util.js'

const _node = Symbol.for('@spect.node')
const _child = Symbol.for('@spect.child')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const buildCache = new WeakMap

const FIELD = 'h:::'

export default function h (statics, ...fields) {
  let build

  // hyperscript - turn to tpl literal call
  // FIXME: there must be standard builder - creating that key is SLOW
  // FIXME: should be Array.isTemplateObject(statics)
  // h(tag, props, ...children)
  if (!statics.raw) {
    // h(tag, ...children)
    let props = fields.length && (fields[0] == null || object(fields[0])) ? fields.shift() : null

    // h('div', props?, ...children?)
    if (primitive(statics)){
      build = buildCache[statics]
      if (!build) buildCache[statics] = build = createBuilder(`<${statics} ...${FIELD}>${FIELD}</${statics}>`)
      return build(props, fields)
    }
    // h(target, props?, ...children)
    else {
      build = buildCache.get(statics)
      if (!build) buildCache.set(statics, build = createBuilder(`<${FIELD} ...${FIELD}>${FIELD}</>`))
      return build(statics, props, fields)
    }
  }

  build = buildCache.get(statics)
  if (!build) buildCache.set(statics, build = createBuilder(statics.join(FIELD)))

  return build(...fields)
}

function createBuilder(str) {
  const tpl = document.createElement('template')

  // fields order is co-directional with tree walker order, so field number can simply be incremented, avoiding regexps
  str = str
    // <> → <h:::>
    .replace(/<(>|\s)/, '<' + FIELD + '$1')
    // <abc .../> → <abc ...></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</' + FIELD + '>')
    // .../> → ... />
    .replace(/([^<\s])\/>/g, '$1 />')
    // <a#b.c → <a #b.c
    .replace(/(<[\w:-]+)([#\.][^<>]*>)/g, '$1 $2')
  tpl.innerHTML = str

  // normalize template tree
  let normWalker = document.createTreeWalker(tpl.content, SHOW_TEXT | SHOW_ELEMENT, null), split = [], node
  while (node = normWalker.nextNode()) {
    // child fields into separate text nodes
    if (node.nodeType === TEXT) {
      let cur = [], idx = 0
      // FIXME: replace with while loop
      node.data.split(FIELD).map(part => (
        cur.push(idx), part.length && cur.push(idx += part.length), idx += FIELD.length
      ))
      cur = cur.slice(1, -1)
      if (cur.length) split.push(node, cur)
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

  // a h::: b → a <h::: /> b
  let insertWalker = document.createTreeWalker(tpl.content, SHOW_TEXT, null), replace = [], textNode
  while (textNode = insertWalker.nextNode()) {
    if (textNode.data === FIELD) {
      const node = document.createElement(FIELD)
      node[_child] = true
      replace.push([textNode, node])
    }
  }
  replace.forEach(([from, to]) => from.replaceWith(to))

  // create field evaluators - for each field they make corresponding transformation to [cloned] template
  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const evals = [], tplNodes = tpl.content.querySelectorAll('*')
  for (let tplNode, fieldId = 0, nodeId = 0; tplNode = tplNodes[nodeId]; nodeId++) {
    const j = nodeId
    if (tplNode.localName === FIELD) {
      // <>${n}</> - will be replaced as new node
      if (tplNode[_child]) {
        evals[fieldId++] = function (arg) {
          const node = this[j]
          node[_node] = updateNode(node, arg)
          if (observable(arg)) return sube(arg, tag => (node[_node] = updateNode(node[_node], tag)))
        }
      }
      // <${node}
      else {
        evals[fieldId++] = function (arg) {
          const node = this[j]
          node[_node] = updateNode(node, typeof arg === 'function' ? arg() : arg)
          // render tpl node children/attrs to the replacement
          if (node.hasAttributes()) for (let n = 0, attrs = node.attributes; n < attrs.length; n++) prop(node[_node], attrs[n].name, attrs[n].value)
          merge(arg, arg.childNodes, [...node.childNodes])
          if (observable(arg)) return sube(arg, tag => (node[_node] = updateNode(node[_node], tag)))
        }
        replace.tag = true
      }
    }

    for (let n = 0, m = tplNode.attributes.length; n < m; n++) {
      let { name, value } = tplNode.attributes[n]

      // fields are co-directional with attributes and nodes order, so we just increment fieldId (also healthy insertions!)
      // fields accept generic observables, not bound to spect/v
      // <a ${{}}, <a ${'hidden'}
      if (name === FIELD) {
        tplNode.removeAttribute(name), n--, m--
        evals[fieldId++] = function (arg) {
          if (!arg) return
          const node = this[j][_node] || this[j]
          if (primitive(arg)) prop(node, arg, value)
          // can only be object observable
          else if (observable(arg)) {
            return sube(arg, v => {
              if (primitive(v)) (prop(node, v, value))
              else for (let key in v) prop(node, key, v[key])
            })
          }
          else for (let key in name) prop(node, key, name[key])
        }
      }
      else if (value.includes(FIELD)) {
        // <a a=${b}
        if (value === FIELD) {
          evals[fieldId++] = function (arg) {
            const node = this[j][_node] || this[j]
            return observable(arg) ? sube(arg, v => prop(node, name, v)) : prop(node, name, arg)
          }
        }
        // <a a="b${c}d${e}f"
        else {
          const statics = value.split(FIELD)
          const evalFields = function (...fields) {
            const node = this[j][_node] || this[j]
            const subs = fields.map((field, i) => observable(field) ? (fields[i] = '', field) : null)
            prop(node, name, h.tpl(statics, ...fields))
            return subs.map((sub, i) => sub && sube(sub, v => (fields[i] = v, prop(node, name, h.tpl(statics, ...fields)))))
          }
          evalFields.count = statics.length - 1
          evals[fieldId++] = evalFields
        }
      }
    }
  }

  function build() {
    let cloned, nodes = tplNodes, cleanup = [], frag = tpl.content

    for (let i = 0; i < arguments.length;) {
      const evalField = evals[i]
      if (evalField.count) {
        let fields = []
        for (let j = i, k = i += evalField.count; j < k; j++) {
          if (!cloned && observable(arguments[j])) nodes = (cloned = frag.cloneNode(true)).querySelectorAll('*')
          fields.push(arguments[j])
        }
        cleanup.push(...evalField.apply(nodes, fields).filter(Boolean))
      }
      else {
        const field = arguments[i++]
        // https://jsperf.com/getelementsbyclassname-vs-queryselectorall/236 - the fastest for static selectors
        if (!cloned && (!primitive(field) || evalField.tag)) nodes = (cloned = frag.cloneNode(true)).querySelectorAll('*')
        cleanup.push(evalField.call(nodes, field))
      }
    }

    const root = cloned || frag.cloneNode(true)
    return root.childNodes.length > 1 ? root : root.firstChild
  }

  return build
}

// interpolator
h.tpl = (statics, ...fields) => String.raw({raw: statics}, ...fields.map(value => !value ? '' : value)).trim()

// lil subscriby (v-less)
function sube(target, fn, unsub, stop) {
  if (typeof target === 'function') unsub = target(fn)
  else if (target[symbol.observable]) target[symbol.observable](({subscribe}) => unsub = subscribe({ next: fn }))
  else if (target[Symbol.asyncIterator]) {
    unsub = () => stop = true
    ;(async () => { for await (let v of target) { if (stop) break; fn(v) } })()
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
  // can be node/fragment
  if (to && to.nodeType) {
    from.replaceWith(from = to)
  }
  else {
    to = to == null ? '' : to
    if (from.nodeType === TEXT) from.data = to
    else from.replaceWith(from = document.createTextNode(to))
  }

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

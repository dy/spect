import { symbol, observable, primitive, object, immutable, list } from './util.js'

const _ref = Symbol.for('@spect.ref')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const FIELD = 'h:::', FIELD_CHILD = 'h-child', FIELD_CLASS = 'h-attr'

const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')

const buildCache = new WeakMap

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
      const key = statics + '>' + fields.length
      build = buildCache[key]
      if (!build) {
        if (EMPTY.includes(statics)) (buildCache[key] = build = createBuilder(`<${statics} ...${FIELD} />`)).empty = true
        else (buildCache[key] = build = createBuilder(`<${statics} ...${FIELD}>${Array(fields.length + 1).fill('').join(FIELD)}</${statics}>`))
      }
      return build.empty ? build(props) : build(props, ...fields)
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
      const node = document.createElement(FIELD_CHILD)
      replace.push([textNode, node])
    }
  }
  replace.forEach(([from, to]) => from.replaceWith(to))

  // create field evaluators - for each field they make corresponding transformation to [cloned] template
  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const evalChild = [], evalAttrs = [], evalComp = [], tplNodes = tpl.content.querySelectorAll('*')
  let hasAttributes = false, hasChildren = false, hasComponents = false

  for (let tplNode, fieldId = 0, nodeId = 0; tplNode = tplNodes[nodeId]; nodeId++) {
    // <${node}
    if (tplNode.localName === FIELD) {
      hasComponents = true
      const i = fieldId++
      evalComp.push((node, args) => {
        const arg = args[i]
        // <${el}
        if (arg.nodeType) {
          node[_ref] = updateNode(node, arg)
          // render tpl node children/attrs to the replacement
          if (node.hasAttributes())
            for (let n = 0, attrs = node.attributes; n < attrs.length; n++)
              prop(node[_ref], attrs[n].name, attrs[n].value)
          merge(node[_ref], node[_ref].childNodes, [...node.childNodes])
        }
        // <${Component}
        else if (typeof arg === 'function') {
          node[_ref] = updateNode(node, arg(node))
        }
      })
    }
    // <>${n}</> - will be replaced as new node
    else if (tplNode.localName === FIELD_CHILD) {
      hasChildren = true
      const i = fieldId++
      evalChild.push((node, args) => {
        const arg = args[i]
        node[_ref] = updateNode(node, arg)
        if (observable(arg)) return sube(arg, tag => (node[_ref] = updateNode(node[_ref], tag)))
      })
    }

    const evals = []
    for (let n = 0, m = tplNode.attributes.length; n < m; n++) {
      let { name, value } = tplNode.attributes[n]

      // fields are co-directional with attributes and nodes order, so we just increment fieldId
      // <a ${{}}, <a ${'hidden'}
      if (name === FIELD) {
        const i = fieldId++
        tplNode.removeAttribute(name), n--, m--
        evals.push((node, args) => {
          const arg = args[i]
          if (!arg) return
          let cur = node[_ref] || node
          if (primitive(arg)) prop(cur, arg, value)
          // fields accept generic observables, not bound to spect/v
          else if (observable(arg)) {
            return sube(arg, v => {
              cur = node[_ref] || cur
              if (primitive(v)) prop(cur, v, value)
              else for (let key in v) prop(cur, key, v[key])
            })
          }
          else for (let key in arg) prop(cur, key, arg[key])
        })
      }
      else if (value.includes(FIELD)) {
        // <a a=${b}
        if (value === FIELD) {
          const i = fieldId++
          evals.push((node, args) => {
            const arg = args[i]
            return observable(arg) ? sube(arg, v => prop(node[_ref] || node, name, v)) : prop(node[_ref] || node, name, arg)
          })
        }
        // <a a="b${c}d${e}f"
        else {
          const statics = value.split(FIELD)
          const i = fieldId
          fieldId += statics.length - 1
          evals.push((node, args) => {
            const fields = [].slice.call(args, i, i + statics.length - 1)
            const subs = fields.map((field, i) => observable(field) ? (fields[i] = '', field) : null)
            prop(node[_ref] || node, name, h.tpl(statics, ...fields))
            return subs.map((sub, i) => sub && sube(sub, v => (fields[i] = v, prop(node[_ref] || node, name, h.tpl(statics, ...fields)))))
          })
        }
      }
    }

    if (evals.length) (hasAttributes = true, tplNode.classList.add(FIELD_CLASS), evalAttrs.push(evals))
  }

  function build() {
    let cleanup = [], frag = tpl.content.cloneNode(true), children, child, i

    // query/apply different types of evaluators in turn
    // https://jsperf.com/getelementsbytagname-vs-queryselectorall-vs-treewalk/1
    // FIXME: try to replace with getElementsByClassName, getElementsByTagName
    if (hasChildren) {
      children = frag.querySelectorAll(FIELD_CHILD), i = 0
      while (child = children[i]) cleanup.push(evalChild[i++](child, arguments))
    }
    if (hasAttributes) {
      children = frag.querySelectorAll('.' + FIELD_CLASS), i = 0
      while (child = children[i]) {
        child.classList.remove(FIELD_CLASS)
        const evals = evalAttrs[i++]
        for (let j = 0, evalAttr = evals[0]; j < evals.length; evalAttr = evals[++j]) {
          cleanup.push(evalAttr(child, arguments))
        }
      }
    }
    if (hasComponents) {
      children = frag.querySelectorAll(FIELD), i = 0
      while (child = children[i]) cleanup.push(evalComp[i++](child, arguments))
    }

    return frag.childNodes.length > 1 ? frag : frag.firstChild
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
  if (to && to.nodeType) from.replaceWith(from = to)
  // eg. <h:::/> → [a, b, c] (array children don't support observables)
  else if (to && Array.isArray(to)) from = merge(from.parentNode, [from], to)
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

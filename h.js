import { symbol, observable, primitive, object, attr, channel, immutable, list } from './util.js'

const _group = Symbol.for('@spect.group')
const _ref = Symbol.for('@spect.ref')
const _cur = Symbol.for('@spect.cur')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const buildCache = new WeakMap

const PLACEHOLDER = 'h:::'
const id = str => +str.slice(PLACEHOLDER.length)

export default function h (statics, ...fields) {
  // hyperscript - turn to tpl literal call
  // FIXME: there must be standard builder - creating that key is SLOW
  // if (!statics.raw) {
  //   // h(tag, ...children)
  //   if (!fields.length || !object(fields[0]) && fields[0] != null) fields.unshift(null)
  //   const count = fields.length
  //   if (!primitive(statics)) fields.unshift(statics)

  //   statics = [
  //     ...(primitive(statics) ? [`<${statics} ...`] : ['<', ' ...']),
  //     ...(count < 2 ? [`/>`] : ['>', ...Array(count - 2).fill(''), `</>`])
  //   ]
  // }

  let build = buildCache.get(statics)

  if (!build) {
    const key = statics.join(PLACEHOLDER + '_')
    build = createBuilder(key)
    buildCache.set(statics, build)
  }

  return build(...fields)
}

function createBuilder(str) {
  let c = 0
  const tpl = document.createElement('tpl')

  // ref: https://github.com/developit/htm/blob/26bdff2306dd77dcf82a2d788a8d3e689968b0da/src/index.mjs#L36-L40
  str = str
    // <a h:::_ → <a h:::1
    .replace(/h:::_/g, m => PLACEHOLDER + c++)
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
  let normWalker = document.createTreeWalker(tpl, SHOW_TEXT | SHOW_ELEMENT, null), split = [], node
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
  let insertWalker = document.createTreeWalker(tpl, SHOW_TEXT, null), replace = [], textNode
  while (textNode = insertWalker.nextNode()) {
    if (/^h:::/.test(textNode.data)) {
      const node = document.createElement('h:::')
      node.setAttribute('_', id(textNode.data))
      replace.push([textNode, node])
    }
  }
  replace.forEach(([from, to]) => from.replaceWith(to))

  // create field evaluators - for each field they make corresponding transformation to [cloned] template
  let evals = [], fieldNodes = []

  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const tplNodes = tpl.getElementsByTagName('*')
  for (let i = 0; i < tplNodes.length; i++) {
    let node = tplNodes[i]

    // <h::: _=N - will be replaced
    if (node.hasAttribute('_')) {
      const fieldId = node.getAttribute('_')
      fieldNodes[fieldId] = i

      evals[fieldId] = function () {
        this.i++

        let orig = this || node
        let arg = args[i]

        if (observable(arg)) arg(tag => (orig[_cur] = updateNode(orig[_cur] || orig, tag)))
        else orig[_cur] = updateNode(orig, arg)

        if (!this) node = orig[_cur]
        return orig[_cur]
      }
    }

    if (node.hasAttributes()) {
      for (let j = 0, n = node.attributes.length; j < n; ++j) {
        let { name, value } = node.attributes[j]

        if (name.includes(PLACEHOLDER)) (--j, --n, node.removeAttribute(name))

        let nameFields = fields(name)
        let valueParts = value.split(PLACEHOLDER)

        // <a ${a}=b, <a ${a}, <a a=${b} <a ${a}=${b}
        evals[fieldId] = function () {
          let fields = [], i, primitive = true
          for (i = this.i; i < nameFields.length + valueFields.length; i++) {
            if (!immutable(arguments[i])) primitive = false
          }
          this.i = i

          // FIXME: move observable logic into `attr`?
          if (!observable(value)) return attr(cur, name, cur[name] = value)

          v([nameFields, valueFields])((value, name) => attr(cur, name, cur[name] = value))
        }
      }
    }
  }

  function build() {
    let ctx = {
      root: tpl,
      nodes: tplNodes,
      i: 0, // current field

      // primitive fields modify tpl directly, then clone the node (fast!)
      clone() {
        if (this.cloned) return
        this.root = tpl.cloneNode()
        // https://jsperf.com/getelementsbyclassname-vs-queryselectorall/234
        this.nodes = this.root.getElementsByTagName('*')
        this.cloned = true
      },
      cloned: false
    }

    // fields are co-directional with evaluation sequence
    // in other words, that's impossible to replace some tag after its props being set
    while (ctx.i < arguments.length) evals[ctx.i].apply(ctx, arguments)

    if (!ctx.cloned) ctx.root = tpl.cloneNode(true)

    return ctx.root.childNodes.length > 1 ? ctx.root.childNodes : ctx.root.firstChild
  }

  return build
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
// FIXME: possible to shave off
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
    else if (bi && (!cur || bidx.has(cur))) {
      // swap
      if (b[i] === next && aidx.has(bi)) cur = next

      // insert
      parent.insertBefore(bi, cur)
    }

    // redundant - but allows morphing
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


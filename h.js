import v from '../v.js'
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
    // <a#b.c → <a #b.c
    .replace(/(<[\w:-]+)([#\.][^<>]*>)/g, '$1 $2')
  tpl.innerHTML = str

  // normalize template tree
  const normWalker = document.createTreeWalker(tpl, SHOW_TEXT | SHOW_ELEMENT, null), split = []
  while (normWalker.nextNode()) {
    const node = normWalker.currentNode
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
  const insertWalker = document.createTreeWalker(tpl, SHOW_TEXT, null), replace = []
  while (insertWalker.nextNode()) {
    const textNode = insertWalker.currentNode
    if (/^h:::/.test(textNode.data)) {
      const node = document.createElement('h:::')
      node.setAttribute('_', id(textNode.data))
      replace.push([textNode, node])
    }
  }
  replace.forEach(([from, to]) => from.replaceWith(to))

  // create field evaluators - for each field they make corresponding transformation to template
  let evals = [], fieldNodes = []

  // getElementsByTagName('*') is faster than tree iterator
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const tplNodes = tpl.getElementsByTagName('*')
  for (let i = 0; i < tplNodes.length; i++) {
    let node = tplNodes[i]

    // <h::: _=N - will be replaced
    if (node.hasAttribute('_')) {
      const fieldId = node.getAttribute('_')
      fieldNodes[fieldId] = i

      evals[fieldId] = function (args, i) {
        let orig = this || node
        let arg = args[i]
        if (observable(arg)) {
          v(arg)(tag => (orig[_cur] = updateNode(orig[_cur] || orig, tag)))
        }
        else {
          orig[_cur] = updateNode(orig, arg)
        }

        if (!this) node = orig[_cur]
        return orig[_cur]
      }
    }

    if (node.hasAttributes()) {
      for (let j = 0, n = node.attributes.length; j < n; ++j) {
        let { name, value } = node.attributes[j]

        let nameParts = name.split(PLACEHOLDER), valueParts = value.split(PLACEHOLDER)

        evals[fieldId] = function (args, i) {
          let cur = this || node
          let value = args[i]
          // FIXME: move observable logic into `attr`?
          if (!observable(value)) {
            attr(cur, name, cur[name] = value)
          }
          else {
            v(value)
            (value => attr(cur, name, cur[name] = value))
          }
        }

        // <a ${a}=${b}
        if (nameParts.length && valueParts.length) {
          --j, --n
          node.removeAttribute(name)
          const nameFieldId = id(name), valueFieldId = id(value)
          evals[nameFieldId] = function (args, i) {
            let cur = this || node
            let arg = args[i]
          }
        }

        // <a ${a}=b, <a ${a}
        // FIXME: merge into single field handler?
        if (name.includes(PLACEHOLDER)) {
          --j, --n
          node.removeAttribute(name)
          const fieldId = id(name)
          fieldNodes[fieldId] = i
          evals[fieldId] = function (args, i) {
            let cur = this || node
            name = args[i]
            if (observable(name)) {
              v(name)(name => attr(cur, name, cur[name] = value))
            }
            else attr(cur, name, cur[name] = value)
          }
        }

        // <a a=${b}
        if (value.includes(PLACEHOLDER)) {
          const fieldId = id(value)
          fieldNodes[fieldId] = i
          evals[fieldId] = function (args, i) {
            let cur = this || node
            let value = args[i]
            // FIXME: move observable logic into `attr`?
            if (!observable(value)) {
              attr(cur, name, cur[name] = value)
            }
            else {
              v(value)
              (value => attr(cur, name, cur[name] = value))
            }
          }
        }
      }
    }
  }

  function build() {
    let ctx = { root: tpl, nodes: tplNodes, index: 0, clone: false }

    // fields are co-directional with evaluation sequence
    // in other words, that's impossible to replace some tag after its props being set
    for (; ctx.index < arguments.length; ctx.index++) {

      // primitive fields modify tpl directly, then clone the node (fast!)
      if (!ctx.clone && !immutable(arguments[ctx.index])) {
        ctx.root = tpl.cloneNode()
        ctx.nodes = [...root.getElementsByTagName('*')]
        ctx.clone = true
      }

      evals[ctx.index].apply(ctx, arguments)
    }

    if (!ctx.clone) ctx.root = tpl.cloneNode(true)

    return ctx.root.childNodes.length > 1 ? ctx.root.childNodes : ctx.root.firstChild
  }

  return build
}

function updateNode (from, to) {
  if (key(from) === key(to)) return from

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

function morph() {

    if (immutable(to)) {
    to = to == null ? '' : to
    if (from.nodeType === TEXT) from.data = to
    else from.replaceWith(from = document.createTextNode(to))
  }
  // can be node/fragment
  else if (to.nodeType) from.replaceWith(from = to)

}


// mergeable elements: text, named leaf input
const key = node => node ? (node.nodeType === TEXT ? node.data : node.name && !node.firstChild ? node.name : node) : node

// versions log: https://github.com/luwes/js-diff-benchmark/blob/master/libs/spect.js
export function merge (parent, a, b) {
  let i, j, ai, bj, bprevNext = a[0], bidx = new Set(b), aidx = new Set(a)

  for (i = 0, j = 0; j <= b.length; i++, j++) {
    ai = a[i], bj = b[j]

    if (ai === bj) {}

    else if (ai && !bidx.has(ai)) {
      // replace
      if (bj && !aidx.has(bj)) parent.replaceChild(bj, ai)

      // remove
      else (parent.removeChild(ai), j--)
    }
    else if (bj) {
      // move - skips bj for the following swap
      if (!aidx.has(bj)) i--

      // insert after bj-1, bj
      parent.insertBefore(bj, bprevNext)
    }

    bprevNext = bj && bj.nextSibling
  }

  return b
}

import v from '../v.js'
import { symbol, observable, primitive, object, attr, channel } from '../util.js'

const _group = Symbol.for('@spect.group')
const _ref = Symbol.for('@spect.ref')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const buildCache = new WeakMap

const PLACEHOLDER = 'h:::'
const id = str => +str.slice(PLACEHOLDER.length)
function field(id, fields) {
  let vals = id.split(PLACEHOLDER).slice(1).map(id => fields[id])
  return vals.length > 1 ? vals : vals[0]
}

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
  const insertWalker = document.createTreeWalker(tpl, SHOW_TEXT, null)
  while (insertWalker.nextNode()) {
    const textNode = insertWalker.currentNode
    if (/^h:::/.test(textNode.data)) {
      const node = document.createElement('h:::')
      node.setAttribute('_', id(textNode.data))
      textNode.replaceWith(node)
    }
  }

  // create field evaluators - for each field they make corresponding transformation to template
  let evals = [], fieldNodes = []

  // getElementsByTagName('*') is faster than tree iterator
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const nodes = tpl.getElementsByTagName('*')
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    if (node.hasAttribute('_')) {
      const fieldId = node.getAttribute('_')

      // INSERT / PATCH
      fieldNodes[fieldId] = i

      evals[fieldId] = function (arg) {
        node = this || node

        // can be text/primitive
        if (primitive(arg) || arg instanceof Date || arg instanceof RegExp) {
          arg = arg == null ? '' : arg
          if (node.nodeType === TEXT) node.data = arg
          else node.replaceWith(node = document.createTextNode(arg))
        }

        // can be node/fragment
        else if (arg.nodeType) return node.replaceWith(node = arg)

        // can be an array / array-like
        // if (arg[Symbol.iterator]) {
        //   let marker = document.createTextNode('')
        //   marker[_group] = [...arg].flat().map(arg => nodify(arg))
        //   // create placeholder content (will be ignored by ops)
        //   // marker.textContent = marker[_group].map(n => n.textContent).join('')
        //   return marker
        // }
      }
    }
  }

  function build() {
    let node, nodes// = node.getElementsByTagName('*')
    if (nodes) node = tpl.cloneNode(true)

    // TODO: possible pre-optimization: merge string parts separated by number or string to avoid field evaluator
    // NOTE: simple templates (no-children/no-spread) can be boosted by directly modifying the template and cloning it
    for (let i = 0; i < arguments.length; i++) {
      // WARN: null-context matters
      const evalField = evals[i]
      if (nodes) evalField.call(nodes[fieldNodes[i]], arguments[i])
      else evalField(arguments[i])
    }

    if (!nodes) node = tpl.cloneNode(true)

    return node.childNodes.length > 1 ? node : node.firstChild
  }

  return build
}


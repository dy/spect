import v from '../v.js'
import { symbol, observable, primitive, object, attr, channel, immutable } from './util.js'

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
  const nodes = tpl.getElementsByTagName('*')
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    // <h::: _=N - will be replaced
    if (node.hasAttribute('_')) {
      const fieldId = node.getAttribute('_')
      fieldNodes[fieldId] = i
      evals[fieldId] = function (args, i) {
        node = this || node
        let arg = args[i]

        // observable
        if (observable(arg)) {
          v(arg)(tag => node = updateNode(node, tag))
        }
        else node = updateNode(node, arg)
      }
    }

    if (node.hasAttributes()) {
      for (let j = 0, n = node.attributes.length; j < n; ++j) {
        let { name, value } = node.attributes[j]

        // <a ${a}=${b}
        if (name.includes(PLACEHOLDER) && value.includes(PLACEHOLDER)) {
          --j, --n
          node.removeAttribute(name)
          const nameFieldId = id(name), valueFieldId = id(value)
          evals[nameFieldId] = function (args, i) {
            node = this || node
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
            node = this || node
            name = args[i]
            if (observable(name)) {
              v(name)(name => attr(node, name, node[name] = value))
            }
            else attr(node, name, node[name] = value)
          }
        }

        // <a a=${b}
        if (value.includes(PLACEHOLDER)) {
          const fieldId = id(value)
          fieldNodes[fieldId] = i
          evals[fieldId] = function (args, i) {
            node = this || node
            let value = args[i]
            // FIXME: move observable logic into `attr`?
            if (!observable(value)) {
              attr(node, name, node[name] = value)
            }
            else {
              v(value)
              (value => attr(node, name, node[name] = value))
            }
          }
        }
      }
    }
  }

  function build() {
    let node, nodes

    // fields are co-directional with evaluation sequence
    // in other words, that's impossible to replace some tag after its props being set
    for (let i = 0, evalField; i < arguments.length && (evalField = evals[i]); i++) {

      // simple fields modify tpl directly, then clone the node
      if (!node && immutable(arguments[i])) {
        evalField(arguments, i)
      }

      // observable/object templates work on cloned template
      else {
        if (!nodes) {
          node = tpl.cloneNode(true)
          nodes = [...node.getElementsByTagName('*')]
        }
        // context passes cloned node to modify instead of template
        evalField.call(nodes[fieldNodes[i]], arguments, i)
      }
    }

    if (!node) node = tpl.cloneNode(true)

    return node.childNodes.length > 1 ? node.childNodes : node.firstChild
  }

  return build
}


function updateNode (from, to) {
  if (from === to) return from

  // if (from[_group]) from[_group].map(el => el.remove())
  // if (from[symbol.dispose]) from[symbol.dispose]()

  // if (to[_group]) {
  //   let frag = document.createDocumentFragment()
  //   appendChild(frag, to)
  //   from.replaceWith(frag)
  // }
  // else {
  //   from.replaceWith(to)
  // }

  // can be text/primitive
  if (immutable(to)) {
    to = to == null ? '' : to
    if (from.nodeType === TEXT) from.data = to
    else {
      from.replaceWith(from = document.createTextNode(to))
    }
  }

  // can be node/fragment
  else if (to.nodeType) from.replaceWith(from = to)

  // can be an array / array-like
  // if (arg[Symbol.iterator]) {
  //   let marker = document.createTextNode('')
  //   marker[_group] = [...arg].flat().map(arg => nodify(arg))
  //   // create placeholder content (will be ignored by ops)
  //   // marker.textContent = marker[_group].map(n => n.textContent).join('')
  //   return marker
  // }

  return from
}

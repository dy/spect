import v from '../v.js'
import { symbol, observable, primitive, object, attr, channel, immutable, list } from './util.js'

const _group = Symbol.for('@spect.group')
const _ref = Symbol.for('@spect.ref')
const _cur = Symbol.for('@spect.cur')

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

        // <a ${a}=${b}
        if (name.includes(PLACEHOLDER) && value.includes(PLACEHOLDER)) {
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
    let root, nodes

    // fields are co-directional with evaluation sequence
    // in other words, that's impossible to replace some tag after its props being set
    for (let i = 0, evalField; i < arguments.length && (evalField = evals[i]); i++) {

      // simple fields modify tpl directly, then clone the node
      if (!root && immutable(arguments[i])) {
        evalField(arguments, i)
      }

      // observable/object templates work on cloned template
      else {
        if (!nodes) {
          root = tpl.cloneNode(true)
          nodes = [...root.getElementsByTagName('*')]
        }
        // context passes cloned node to modify instead of template
        nodes[fieldNodes[i]] =  evalField.call(nodes[fieldNodes[i]], arguments, i)
      }
    }

    if (!root) root = tpl.cloneNode(true)

    return root.childNodes.length > 1 ? root.childNodes : root.firstChild
  }

  return build
}


function updateNode (from, to) {
  if (key(from) === key(to)) return from

  // FIXME: special case when preserve parent childNodes
  // if (to === from.parentNode.childNodes) throw Error('Special case')

  // FIXME: map with elements can be written directly to arrays to avoid merge sets creation

  // FIXME: the code can be compacted to generic array-merge case

  // array / array-like
  if (list(to)) {
    if (!list(from)) from = [from]

    if (!to.length) to.push('')
    to = to.map(item => immutable(item) ? document.createTextNode(item) : item)

    from = merge(from[0].parentNode, from, to, from[from.length - 1].nextSibling)
  }
  else {
    // reduce arr to single node
    if (list(from)) {
      let i = 0, l = from.length, match = l - 1, toKey = key(to)
      for (; i < l; i++) {
        if (i < match && key(from[i]) === toKey) match = i
        else if (i !== match) from[i].remove()
      }
      from = from[match]
    }

    if (key(from) === key(to)) return from

    // can be text/primitive
    if (immutable(to)) {
      to = to == null ? '' : to
      if (from.nodeType === TEXT) from.data = to
      else {
        from.replaceWith(from = document.createTextNode(to))
      }
    }

    // can be node/fragment
    else if (to.nodeType) {
      from.replaceWith(from = to)
    }
  }

  return from
}

const key = node => node && node.nodeType === TEXT ? node.data : node



export  function diff (parent, a, b, before) {
  const bmap = new Map, amap = new Map, nextSibling = Array(a.length)
  let i, j, ai, bj, ij, ji, previj, cur

  // create index
  for (i = 0; i < b.length; i++) bmap.set(b[i], i)
  for (i = 0; i < a.length; i++) amap.set(a[i], i)

  // align items
  for (i = 0, j = 0; i < a.length || j < b.length; i++, j++) {
    ai = a[i], bj = b[j], ij = bmap.get(ai), ji = amap.get(bj)

    // replaced
    if (ai != null && bj != null && ij == null && ji == null) {
      parent.replaceChild(bj, ai)
      nextSibling[j] = a[i + 1]
      nextSibling[j-1] = bj
    }
    // removed
    else if (ai != null && ij == null) {
      parent.removeChild(ai)
      nextSibling[previj] = a[i + 1]
      j--
    }
    // added
    else if (bj != null && ji == null) {
      parent.insertBefore(bj, nextSibling[j] = ai || before)
      nextSibling[j-1] = bj
      i--
    }
    // moved
    else {
      nextSibling[ij] = a[i + 1]
    }

    previj = ij
  }

  // reorder
  for (cur = before, j = b.length; j--;) {
    bj = b[j]
    if (nextSibling[j] != cur) {
      parent.insertBefore(bj, cur)
    }
    cur = bj
  }

  return b
}




// merge 2 arrays, ref: https://github.com/luwes/js-diff-benchmark/blob/master/libs/list-difference.js
// function mergeOld (parent, a, b, before) {
//   const aIdx = new Map();
//   const bIdx = new Map();
//   let i;
//   let j;

//   // Create a mapping from keys to their position in the old list
//   for (i = 0; i < a.length; i++) {
//     aIdx.set(a[i], i);
//   }

//   // Create a mapping from keys to their position in the new list
//   for (i = 0; i < b.length; i++) {
//     bIdx.set(b[i], i);
//   }

//   for (i = j = 0; i < a.length || j < b.length;) {
//     let aElm = a[i], bElm = b[j];
//     // This is a element that has been moved to earlier in the list
//     if (aElm === null) {
//       i++;
//     }
//     // No more elements in old, this is an addition
//     else if (i >= a.length) {
//       parent.insertBefore(bElm, aElm || before);
//       j++;
//     }
//     else if (j >= b.length) {
//       parent.removeChild(aElm)
//       i++;
//     }
//     // No difference, we move on
//     else if (key(aElm) === key(bElm)) {
//       if (aElm !== bElm) b[j] = aElm
//       i++; j++;
//     }
//     // No more elements in new or elem is removed
//     else if (!bIdx.has(key(aElm))) {
//       parent.removeChild(aElm);
//       i++;
//     }
//     // insert/move new elem
//     else {
//       let bOldIdx = aIdx.get(key(bElm))
//       if (bOldIdx != null) {
//         bElm = a[bOldIdx]
//         a[bOldIdx] = null
//       }
//       parent.insertBefore(bElm, aElm || before)
//       j++
//     }
//   }

//   return b;
// }


// merge 2 arrays, ref: https://github.com/luwes/js-diff-benchmark/blob/master/libs/list-difference.js
// function merge (parent, a, b, before) {
//   const remove = new Set()
//   const insert = new Map()
//   const move = new Map()
//   let i, j, ai, bj

//   // detect nodes to add/remove
//   for (i = 0; i < b.length; i++) {
//     insert.set(b[i], i);
//   }
//   for (i = 0; i < a.length; i++) {
//     ai = a[i]
//     if (insert.has(ai)) (move.set(ai, insert.get(ai)), insert.delete(ai))
//     else remove.add(ai)
//   }

//   const stash = {}
//   for (i = j = 0; i < a.length || j < b.length;) {
//     ai = a[i], bj = b[j]

//     if (stash[j]) {
//       parent.insertBefore(stash[j], bj)
//       stash[j] = null
//     }

//     if (ai === bj) { i++, j++ }
//     else if (insert.has(bj)) {
//       parent.insertBefore(b, ai || before),
//       insert.delete(b)
//       j++
//     }
//     else if (remove.has(ai)) {
//       parent.removeChild(ai)
//       remove.delete(ai)
//       i++
//     }
//     else if (move.has(ai)) {
//       stash[j] = ai
//       move.delete(ai)
//       i++
//     }
//     else { i++, j++ }
//   }

//   // do shuffles
//   while (move.size) {

//     let i = move.pop(), ai = move.pop()
//     parent.insertBefore(ai, b[i])
//   }

//   return b
// }

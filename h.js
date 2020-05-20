import { symbol, observable, primitive, attr, slice, esc } from './src/util.js'

// FIXME: avoid H_FIELD

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

export default function html(statics) {
  // hyperscript redirect
  // FIXME: should be Array.isTemplateObject(statics)
  if (!statics.raw) return h.apply(null, arguments)

  let build = cache.get(statics)

  // FIXME: pre-parse program/parts the first run, render fast with primitives
  // - that splits cost of template creation between the first and 2nd runs
  // - ? can first created element be reused on second parse?
  // FIXME: fall back to h function to handle evaluate-able elements:
  // - central point of processing components / observable props (otherwise messy)
  // - can cache props in some way to avoid evaluating props object cost
  if (!build) cache.set(arguments[0], build = createTemplate.apply(null, arguments))

  return build(arguments)
}

function createTemplate (statics) {
  let template = document.createElement('template')

  // 0. prepares string for innerHTML, creates program for affected nodes
  // getElementById is faster than node path tracking (id is path in a way) https://jsperf.com/queryselector-vs-prop-access
  // fields order is co-directional with tree walker
  // source: src/parse.js
  let mode = TEXT, buf = '', quote = '', attr, char, sel, el,
      // transformed statics
      parts = [], part,
      // current element program (id/query, props, children type)
      prog = [0, 0]

  const commit = () => {
    if (mode === ELEM) {prog.push(ELEM, el = buf || H_TAG), mode = ATTR }
    else if (attr) {
      if (buf) attr.push(buf)
      if (attr.length === 1) (prog.pop(), prog.push(attr[0]))
      attr = undefined
    }
    sel = buf = ''
  }

  // parser
	for (let i=0; i<statics.length; ) {
    part = ''

		for (let j=0; j < statics[i].length; j++) {
			char = statics[i][j];

			if (mode === TEXT) {
        if (char === '<') { mode = ELEM, buf = '' }
      }
      // Ignore everything until the last three characters are '-', '-' and '>'
			else if (mode === COMM) {
        if (buf === '--' && char === '>') { mode = TEXT, buf = '' }
        else { buf = char + buf[0] }
        char = ''
      }

      // <a#id, <a.class
      else if ((mode === ELEM || sel) && (char === '#' || char === '.')) {
        part += buf ? '' : H_TAG
        if (!sel) ( commit(), mode = ATTR )
        sel = char
        part += (sel === '#' ? ' id=' : ' class=')
        char = ''
      }

      else if (quote) { if (char === quote) (quote = ''); else (buf += char) }
			else if (char === '"' || char === "'") (quote = char)

			else if (char === '>') {
        // <//>, </> → </comp>
        if (!mode && (!buf || buf === '/')) part = part.slice(0, buf ? -buf.length : undefined) + H_TAG
        // <x/> → <x></x>
        else if (buf.slice(-1) === '/') (buf = buf.slice(0,-1), commit(), part = part.slice(0, -1) + '></' + el + '>', char = '')
        else commit()
        mode = TEXT
      }
      // Ignore everything until the tag ends
			else if (!mode) buf = char

      else if (char === '/') {
        // </x...
        if (mode === ELEM && !buf) (mode = 0, buf = '' )
        // x/> → x />
        else buf += char
      }
			else if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        // <a,   <#a ;  ELEM,  field, #children
        commit()
			}
			else buf += char;

      // detect comment
			if (mode === ELEM && buf === '!--') { mode = COMM, part = part.slice(0, -3) } else part += char
		}

    if (++i < statics.length) {
      // >a${1}b${2}c<  →  >a<!--1-->b<!--2-->c<
      if (mode === TEXT) part += '<!--' + i + '-->'
      // <${el} → <h--tag;    ELEM, field, children
      else if (mode === ELEM) (prog.push(COMP, i), part += el = H_TAG, mode = ATTR)
      else if (mode === ATTR) {
        // <xxx ...${{}};    ATTR, null, field
        if (buf === '...') { prog.push(ATTR, null, i), part = part.slice(0, -4) }
        // <xxx ${'name'};    ATTR, field, null
        else if (!buf && !attr) { prog.push(ATTR, i, true) }
        else {
          let eq = buf.indexOf('=')

          // <xxx c="a${b}c", <xxx c=a${b}c ;   ATTR, name, [a, field, b, ...]
          if (~eq) {prog.push(ATTR, buf.slice(0, eq), attr = []), buf = buf.slice(eq + 1)}
          if (buf) attr.push(buf)
          attr.push(i)

          part += H_FIELD
        }
      }

      buf = ''
    }

    parts.push(part)
	}

  // 1. template is created via innerHTML
  template.innerHTML = parts.join('')

  // 2. node iterator replaces comments (child fields) with blank texts (pre-optimizes for text morphing)
  //    collects meaningful node programs, assigns their nodes ids.
  //    Note that we can't modify template directly and then clone it, like it is done in h-reducers fastTemplate:
  //    because if it happens to create async fields element, there will be flash of old content (cleaning up tpl is less effective)
  // getElementsByTagName('*') is faster than tree iterator/querySelector('*'), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  let it = document.createTreeWalker(template.content, SHOW_ELEMENT),
      i = 0, program = ['let el,comp,child,res\n'],
      node = template.content,
      single = node.childNodes.length === 1,
      singleRender = false

  while (node) {
    let type = prog.shift(), sel = prog.shift(), children = [], count = 0, k, v, props = [], id

    // increment id just to make i reflect node order
    id = '--' + sel + '-' + (i++).toString(36)

    // collect child ids
    for (let j = 0, child; child = node.childNodes[j++];)
      if (child.nodeType === COMM) children.push(+child.data), child.replaceWith(document.createTextNode('')), count++
      else children.push(-j)

    // actualize program
    if (prog[0] === ATTR || count || type === COMP || type === FRAG) {
      if (type) {
        // collect static props for component
        if (type === FRAG || type === COMP) for (let attr of node.attributes) props.push(`"${esc(attr.name)}":"${esc(attr.value)}"`)

        if (!node.id) props.push('id:' + (node.hasAttribute('id') ? '""' : 'null')), node.id = id

        // h`<${b}/>` - b is kept in its own parent
        // h`<a><${b}/></a>` - b is placed to a
        // for that purpose a placeholder is put into parent container, and replaced back on return
        // FIXME: if there's a better/faster way - do that. If keep element in own parent - have to figure out way to query els.
        if (i === 2) {
          if (single && type === FRAG) program.push(`args[${sel}].replaceWith(frag._ref=document.createComment('')),`), singleRender = true
          program.push(`el=frag.firstElementChild,child=el.childNodes,`)
        }
        else program.push(`el=frag.getElementById("${esc(node.id)}"),child=el.childNodes,`)

        if (type === COMP || type === FRAG) program.push(`el.replaceWith(this(args[${sel}]`)
        else program.push(`this(el`)
      }
      else program.push('child=frag.childNodes,this(frag')

      // collect attrib commands / skip to the next element
      if (props.length || prog[0] === ATTR || type === COMP || type === FRAG) {
        while (prog[0] === ATTR) {
          prog.shift()
          k = prog.shift(), v = prog.shift()

          // ...${props}
          if (k == null) props.push(`...args[${v}]`)
          // name=${value}
          else if (typeof v === 'number') props.push(`"${esc(k)}":args[${v}]`)
          // name="a${value}b"
          else if (Array.isArray(v)) props.push(`"${esc(k)}":[${
            v.map(v => typeof v === 'number' ? `args[${v}]` : `"${esc(v)}"`).join(',')
          }].filter(Boolean).join('')`)
          // ${'name'}
          else if (typeof k === 'number') props.push(`[args[${k}]]:true`)
          // a=b
          // else props[k] = v
        }

        program.push(',{',props.join(','),'}')
      }
      else program.push(',null')

      if (children.length) program.push(',', children.map(i => i > 0 ? `args[${i}]` : `child[${~i}]`).join(','))

      program.push(type === FRAG || type === COMP ? '))\n' : ')\n')
    }

    node = it.nextNode()
  }
  if (singleRender) program.push('frag._ref.replaceWith(el=frag.firstChild); return el')
  else program.push(single ? 'return frag.firstChild' : 'return frag')


  const evaluate = new Function('frag', 'args', program.join('')).bind(h)

  // 3. builder clones template and runs program on it - query/apply props/merge children/do observables
  return args => evaluate(template.content.cloneNode(true), args)
}

// compact hyperscript
export function h(tag, props) {
  if (typeof tag === 'string') {
    let id, cls
    // hyperscript-compat
    [tag, id] = tag.split('#'), [tag, ...cls] = tag.split('.')
    if (id || cls.length) {
      props = props || {}
      if (id) props.id = id
      if (cls.length) props.class = cls
    }
    tag = document.createElement(tag)
  }
  else if (typeof tag === 'function') {
    tag = tag({children: slice(arguments, 2), ...props})
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
  let cleanup = [], subs = [], i
  for (let name in props) {
    let value = props[name]
    // primitive is more probable also less expensive than observable check
    if (primitive(value)) prop(tag, name, value)
    else if (observable(value)) cleanup.push(sube(value, v => prop(tag, name, v)))
    else prop(tag, name, value)
  }

  // merge children
  for (i = 2; i < arguments.length; i++)
    if (observable(arguments[i])) cleanup.push(subs[i] = arguments[i]), arguments[i] = document.createTextNode('')

  // append shortcut
  if (!tag.childNodes.length) for (i of flat(arguments)) tag.append(i)
  else merge(tag, tag.childNodes, flat(arguments))

  subs.map((sub, i) => sube(sub, child => (
    arguments[i] = child,
    merge(tag, tag.childNodes, flat(arguments))
  )))

  if (cleanup.length) tag._cleanup = cleanup

  return tag
}

const flat = (args) => {
  let out = [], i = 2, item
  for (; i < args.length;) {
    item = args[i++]
    if (item != null) {
      if (primitive(item) || item.nodeType) out.push(item)
      else if (item[Symbol.iterator]) for (item of item) out.push(item)
      else out.push(item)
    }
  }
  return out
}

// lil subscriby (v-less)
function sube(target, fn) {
  let unsub, stop
  if (typeof target === 'function') unsub = target(fn)
  else if (target[symbol.observable]) target[symbol.observable](({subscribe}) => unsub = subscribe({ next: fn }))
  else if (target[Symbol.asyncIterator]) {
    unsub = () => stop = true
    ;(async () => { for await (target of target) { if (stop) break; fn(target) } })()
  }
  return unsub
}

const prop = (el, name, value) => attr(el, name, el[name] = value)

// FIXME: make same-key morph for faster updates
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

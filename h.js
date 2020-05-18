import { symbol, observable, primitive, attr, slice } from './src/util.js'

// DOM
const TEXT = 3, ELEM = 1, ATTR = 2, COMM = 8, FRAG = 11, COMP = FRAG,
      SHOW_ELEMENT = 1, SHOW_TEXT = 4, SHOW_COMMENT = 128

// placeholders
const ZWSP = '\u200B', ZWNJ = '\u200C', ZWJ = '\u200D', H_TAG = 'h:tag', H_FIELD = ZWNJ



// character for node id, ref https://mathiasbynens.be/notes/html5-id-class
// const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// see also https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
// const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')

// FIXME: move these comments to appropriate places
// why `!immutables` and not `observable`:
// - fn field cannot be cloned afterwards (like onclick)
// - object field may one-way add attribs (spoil fast node) and also may have observable prop
// - array field can insert additional children, spoiling numeration of _childFields

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
  if (!build) cache.set(arguments[0], build = createTemplate(arguments[0]))

  return build(arguments)
}

const createTemplate = (statics) => {
  let template = document.createElement('template')

  // 0. prepares string for innerHTML, creates program for affected nodes
  // getElementById is faster than node path tracking (id is path in a way) https://jsperf.com/queryselector-vs-prop-access
  // fields order is co-directional with tree walker
  // source: src/parse.js
  let mode = TEXT, buf = '', quote = '', attr, char, sel,
      // transformed statics
      parts = [], part,
      // current element program (id/query, props, children type)
      prog = [0, null]

  const commit = () => {
    if (mode === ELEM) {prog.push(ELEM, buf), mode = ATTR }
    else if (attr) {
      if (buf) attr.push(buf)
      if (attr.length === 1) (prog.pop(), prog.push(attr[0]))
      attr = undefined
    }
    sel = buf = ''
  }

  // walker / mode manager
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
        else ( commit() )
        mode = TEXT
      }
      // Ignore everything until the tag ends
			else if (!mode) buf = char

      else if (char === '/') {
        // </x...
        if (mode === ELEM && !buf) (mode = 0, buf = '' )
        // x/> → x />
        else if ((!j || buf) && statics[i][j+1] === '>') { part += ' ' }
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
      else if (mode === ELEM) ( prog.push(COMP, i), part += H_TAG, mode = ATTR )
      else if (mode === ATTR) {
        // <xxx ...${{}};    ATTR, null, field
        if (buf === '...') { prog.push(ATTR, null, i), part = part.slice(0, -4) }
        // <xxx ${'name'};    ATTR, field, true
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
  let it = document.createTreeWalker(template.content, SHOW_ELEMENT), node = template.content, i = 0, program = [], id

  while (node) {
    let type = prog.shift(), sel = prog.shift(), children = [], count = 0, props

    // collect child ids
    for (let j = 0, child; child = node.childNodes[j++];)
      if (child.nodeType === COMM) children.push(+child.data), child.replaceWith(document.createTextNode('')), count++
      else children.push(-j)

    // actualize program
    if (prog[0] === ATTR || count || type === COMP) {
      // collect static props for component
      props = {}
      if (type === COMP) for (let attr of node.attributes) props[attr.name] = attr.value

      if (!node.id || node.id === H_FIELD) {
        program.push(type, id = sel + '-' + (i++).toString(36), props)
        // FIXME: -1 points to not existing argument, but is that safe?
        if (!node.id) program.push(ATTR, 'id', null)
        node.id = id
      }
      else program.push(type, node.id, props)

      // collect attrib commands / skip to the next element
      while (prog[0] === ATTR) program.push(prog.shift(), prog.shift(), prog.shift())

      program.push(TEXT, children)
    }

    node = it.nextNode()
  }

  // 3. builder clones template and runs program on it - query/apply props/merge children/do observables
  return args => {
    let frag = template.content.cloneNode(true), i = 0, c, el, k, v, props, children, comp

    // VM inspired by https://twitter.com/jviide/status/1257755526722662405, see ./test/stacker.html
    // iteration is cheap, but h call is slow, therefore props / children are evaluated in-place
    // it is ~5% slower than direct eval, but without metaphysics
    for (; i < program.length;) {
      c = program[i++]

      if (c === ELEM || c === COMP) {
        // <a
        el = (el = program[i++]) ? frag.getElementById(el) : frag
        props = Object.assign({}, program[i++])

        // <${el}, <${Comp}
        if (c === COMP) comp = args[el.id.split('-')[0]]
      }
      else if (c === ATTR) {
        k = program[i++], v = program[i++]
        // ...${props}
        if (k == null) Object.assign(props, v)
        // name=${value}
        else if (typeof v === 'number') props[k] = args[v]
        // name="a${value}b"
        else if (Array.isArray(v)) props[k] = v.map(v => typeof v === 'number' ? args[v] : v).filter(Boolean).join('')
        // ${'name'}
        else if (typeof k === 'number') props[args[k]] = v
        // a=b
        else props[k] = v
      }
      else if (c === TEXT) {
        // i > 0 - take child from args, i <= 0 - take child from self children
        children = program[i++].map(i => i > 0 ? args[i] : el.childNodes[~i])

        if (typeof comp === 'function') el = comp(Object.assign(props, {children}))
        else if (comp) el = comp

        h(el, props, ...children)
      }
    }

    return frag.childNodes.length === 1 ? frag.firstChild : frag
  }
}

// compact hyperscript
export function h(tag, props, ...children) {
  // render redirect
  if (typeof tag === 'string') {
    let id, cls
    [tag, id] = tag.split('#'), [tag, ...cls] = tag.split('.')
    if (id || cls.length) props = props || {}
    if (id) props.id = id
    if (cls.length) props.class = cls
    tag = document.createElement(tag)
  }
  else if (typeof tag === 'function') {
    tag = tag(Object.assign({children}, props))
  }

  // clean up previous observables
  if (tag._cleanup) tag._cleanup.map(fn => fn())

  // apply props
  let cleanup = [], subs = []
  for (let name in props) {
    let value = props[name]
    // primitive is more probable also less expensive than observable check
    if (primitive(value)) prop(tag, name, value)
    else if (observable(value)) cleanup.push(sube(value, v => prop(tag, name, v)))
    else prop(tag, name, value)
  }

  // merge children
  if (arguments.length > 2) {
    for (let i = 0; i < children.length; i++)
      if (observable(children[i])) cleanup.push(subs[i] = children[i]), children[i] = document.createTextNode('')

    merge(tag, tag.childNodes, flat(children))

    subs.map((sub, i) => sube(sub, child => (
      children[i] = child,
      merge(tag, tag.childNodes, flat(children))
    )))
  }

  if (cleanup.length) tag._cleanup = cleanup

  return tag
}

const flat = (list) => {
  let out = []
  for (let item of list) {
    if (primitive(item) || item.nodeType) out.push(item)
    else if (item[Symbol.iterator]) for (item of item) out.push(item)
    else out.push(item)
  }
  return out
}

// join an array with a function
const join = (arr, fn) => {
  let str = '', i = 0
  for (; i < arr.length - 1; i++) str += arr[i] + fn(i)
  return str += arr[i]
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

  // append/prepend/trim shortcuts
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

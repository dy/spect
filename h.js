import { symbol, observable, primitive, immutable, list } from './src/util.js'

const _ref = Symbol.for('@spect.ref')

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const FIELD = 'h--field', FIELD_CHILD = 'h--child', FIELD_ATTR = 'h--attrs'

const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')

const buildCache = new Map

export default function h (statics, ...fields) {
  let build

  // hyperscript - turn to tpl literal call
  // FIXME: there must be standard builder - creating that key is SLOW
  // FIXME: should be Array.isTemplateObject(statics)
  // h(tag, props, ...children)
  if (!statics.raw) {
    let props = (fields[0] == null || fields[0].constructor === Object || observable(fields[0])) && fields.shift()

    // h('div', props?, ...children?)
    if (primitive(statics)){
      const key = statics + '>' + fields.length
      build = buildCache[key]
      if (!build) {
        if (!statics) (buildCache[key] = build = createBuilder(FIELD.repeat(fields.length))).frag = true
        else if (EMPTY.includes(statics)) (buildCache[key] = build = createBuilder(`<${statics} ...${FIELD} />`)).empty = true
        else (buildCache[key] = build = createBuilder(`<${statics} ...${FIELD}>${FIELD.repeat(fields.length)}</${statics}>`))
      }
      return build.frag ? build(...fields) : build.empty ? build(props) : build(props, ...fields)
    }
    // h(target, props?, ...children)
    else {
      build = buildCache.get(statics)
      if (!build) buildCache.set(statics, build = createBuilder(`<${FIELD} ...${FIELD}>${FIELD.repeat(fields.length)}</>`))
      return build(statics, props, ...fields)
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
    // <abc x/> → <abc x></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</' + FIELD + '>')
    // x/> → x />
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
        // <a #b.c
        if (/^#|^\.\b/.test(name)) {
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

  // create field evaluators - for each field they make corresponding transformation to cloned template
  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  const evalChild = [], evalAttrs = [], evalComp = [], tplNodes = tpl.content.querySelectorAll('*')
  let hasAttributes = false, hasChildren = false, hasComponents = false

  // FIXME: instead of per-child eval, use single per-children eval, therefore less evaluators
  // FIXME: use single loop above to create evaluators
  for (let tplNode, fieldId = 0, nodeId = 0; tplNode = tplNodes[nodeId]; nodeId++) {
    // <${node}
    if (tplNode.localName === FIELD) {
      hasComponents = true
      const i = fieldId++
      evalComp.push((node, args) => {
        const arg = args[i], props = node[_ref]

        // collect simple props
        for (let n = 0, name, value; n < node.attributes.length && ({ name, value } = node.attributes[n]); n++)
          if (!(name in props)) props[name] = value

        // <${el}
        if (arg.nodeType) {
          // h`<${b}/>` - b is kept in its own parent
          // h`<a><${b}/></a>` - b is placed to a
          node[_ref] = (updateNode(node, node.parentNode.nodeType === FRAGMENT ? document.createTextNode('') : arg))[_ref] = arg

          // render tpl node children/attrs/props to the replacement
          for (let key in props) prop(arg, key, props[key])
            merge(arg, arg.childNodes, [...node.childNodes])
        }
        // <${Component} - collect props to render components later
        else if (typeof arg === 'function') {
          node[_ref] = updateNode(node, arg(props))
        }
      })
    }
    // <>${n}</> - will be replaced as new node
    else if (tplNode.localName === FIELD_CHILD) {
      hasChildren = true
      const i = fieldId++
      evalChild.push((node, args, fast) => {
        const arg = args[i]
        if (!fast && observable(arg)) {
          // init placeholder node
          node[_ref] = updateNode(node, document.createTextNode(''))
          return sube(arg, tag => (node[_ref] = updateNode(node[_ref], tag)))
        }
        node[_ref] = updateNode(node[_ref] || node, arg)
      })
    }

    const evals = []
    for (let n = 0, m = tplNode.attributes.length; n < m; n++) {
      let { name, value } = tplNode.attributes[n]

      // fields are co-directional with attributes and nodes order, so we just increment fieldId
      // <a ${'hidden'}
      if (name === FIELD) {
        const i = fieldId++
        tplNode.removeAttribute(name), n--, m--
        evals.push((node, args) => args[i] && prop(node[_ref] || node, args[i], value))
      }
      // <a ...${{}}
      else if (name.includes(FIELD)) {
        const i = fieldId++
        tplNode.removeAttribute(name), n--, m--
        evals.push((node, args, fast, subs = !fast && []) => {
          const arg = args[i]
          if (!arg) return

          // no need for placeholder props
          if (!fast && observable(arg)) return sube(arg, v => { for (let key in v) prop(node[_ref] || node, key, v[key]) })

          for (let key in arg) prop(node[_ref] || node, key, arg[key])
          return subs
        })
      }
      else if (value.includes(FIELD)) {
        // <a a=${b}
        if (value === FIELD) {
          const i = fieldId++
          evals.push((node, args, fast) => {
            const arg = args[i]
            if (!fast && observable(arg)) {
              prop(node[_ref] || node, name, '')
              return sube(arg, v => prop(node[_ref] || node, name, v))
            }
            prop(node[_ref] || node, name, arg)
          })
        }
        // <a a="b${c}d${e}f"
        else {
          const statics = value.split(FIELD)
          const i = fieldId
          fieldId += statics.length - 1
          evals.push((node, args, fast, subs) => {
            const fields = [].slice.call(args, i, i + statics.length - 1)
            if (fast) return prop(node[_ref] || node, name, h.tpl(statics, ...fields))

            subs = fields.map((field, i) => observable(field) ? (fields[i] = '', field) : null)
            prop(node[_ref] || node, name, h.tpl(statics, ...fields))
            return subs.map((sub, i) => sub && sube(sub, v => (fields[i] = v, prop(node[_ref] || node, name, h.tpl(statics, ...fields)))))
          })
        }
      }
    }
    if (evals.length) (hasAttributes = true, tplNode.classList.add(FIELD_ATTR), evalAttrs.push(evals))
  }

  // static template is used for short-path rendering by changing tpl directly & cloning
  const staticTpl = !hasComponents && tpl.cloneNode(true),
        staticChildren = !hasComponents && hasChildren && staticTpl.content.querySelectorAll(FIELD_CHILD),
        staticAttributes = !hasComponents && hasAttributes && staticTpl.content.querySelectorAll('.' + FIELD_ATTR)
  if (staticAttributes.length) staticAttributes.forEach(child => (child.classList.remove(FIELD_ATTR), !child.classList.length && child.removeAttribute('class')))

  function build() {
    let cleanup = [], fast = !hasComponents, frag, children, child, i, components

    // if all primitives - take short path - modify tpl directly & clone
    // why immutables - fn cannot be cloned, object one-way sets attribs and may have observable prop
    if (!hasComponents) for (i = 0; i < arguments.length; i++) if (!immutable(arguments[i])) { fast = false; break }

    frag = fast ? staticTpl : tpl.content.cloneNode(true)


    // query/apply different types of evaluators in turn
    // https://jsperf.com/getelementsbytagname-vs-queryselectorall-vs-treewalk/1
    // FIXME: try to replace with getElementsByClassName, getElementsByTagName
    if (hasChildren) {
      children = fast ? staticChildren : frag.querySelectorAll(FIELD_CHILD), i = 0
      while (child = children[i]) cleanup.push(evalChild[i++](child, arguments, fast))
    }
    // assign props stash for components to collect attribs
    if (hasComponents) {
      components = frag.querySelectorAll(FIELD), i = 0
      while (child = components[i++]) child[_ref] = {}
    }
    if (hasAttributes) {
      children = fast ? staticAttributes : frag.querySelectorAll('.' + FIELD_ATTR), i = 0
      while (child = children[i]) {
        if (!fast) (child.classList.remove(FIELD_ATTR), !child.classList.length && child.removeAttribute('class'))
        for (let j = 0, evals = evalAttrs[i++], evalAttr = evals[0]; j < evals.length; evalAttr = evals[++j])
          cleanup.push(evalAttr(child, arguments, fast))
      }
    }
    // evaluate components with collected props
    if (hasComponents) {
      i = 0
      while (child = components[i]) cleanup.push(evalComp[i++](child, arguments))
    }

    if (fast) frag = frag.cloneNode(true).content
    return frag.childNodes.length === 1 ? frag.firstChild[_ref] || frag.firstChild : frag
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

// we can't handle observable subscription here - it deals with node[_ref], which is not this function concern
function prop (el, name, value) {
  // if (arguments.length < 3) return (value = el.getAttribute(name)) === '' ? true : value

  el[name] = value

  if (!el.setAttribute) return

  if (primitive(value)) {
    if (value === false || value == null) el.removeAttribute(name)
    else el.setAttribute(name, value === true ? '' : value)
  }
  // class=[a, b, ...c] - possib observables
  else if (Array.isArray(value)) {
    el.setAttribute(name, value.filter(Boolean).join(' '))
  }
  // onclick={} - just ignore
  else if (typeof value === 'function') {}
  // style={}
  else if (value.constructor === Object) {
    let values = Object.values(value)
    el.setAttribute(name, Object.keys(value).map((key, i) => `${key}: ${values[i]};`).join(' '))
  }
}

function updateNode (from, to) {
  if (same(from, to)) return from

  // FIXME: special case when preserve parent childNodes
  // if (to === from.parentNode.childNodes) throw Error('Special case')

  // array / array-like
  if (list(to) || list(from)) {
    if (!list(from)) from = [from]
    if (!list(to)) to = [to]
    if (to.length === 1 && from.length === 1) return morph(from[0], to[0])
    if (!to.length) to.push('')
    // non-arrays have unique elements
    if (to.map) to = to.map(item => immutable(item) ? document.createTextNode(item) : item)
    else to = [...to]
    from = merge(from[0].parentNode, from, to, from[from.length - 1].nextSibling)
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

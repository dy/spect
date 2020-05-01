import { symbol, observable, primitive, immutable, list, attr } from './src/util.js'

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4

const FIELD = 'h--field', FIELD_CLASS = 'h--node'

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
  str = str.trim()
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

  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  let normWalker = document.createTreeWalker(tpl.content, SHOW_ELEMENT, null), tplNode,
      hasFields = false, hasComponents = false, fieldId = 0

  // fields are co-directional with node sequence in document, attributes and childNodes order, so we just increment fieldId
  while (tplNode = normWalker.nextNode()) {
    // collect component fields, like <${node}
    if (tplNode.localName === FIELD) {
      hasComponents = true
      const i = fieldId++
      evalComp.push((node, args) => {
        const arg = args[i], props = node._ref

        // collect simple props
        for (let n = 0, name, value; n < node.attributes.length && ({ name, value } = node.attributes[n]); n++)
          if (!(name in props)) props[name] = value

        // <${el}
        if (arg.nodeType) {
          // h`<${b}/>` - b is kept in its own parent
          // h`<a><${b}/></a>` - b is placed to a
          node._ref = (updateNode(node, node.parentNode.nodeType === FRAGMENT ? document.createTextNode('') : arg))._ref = arg

          // render tpl node children/attrs/props to the replacement
          for (let key in props) prop(arg, key, props[key])
            merge(arg, arg.childNodes, [...node.childNodes])
        }
        // <${Component} - collect props to render components later
        else if (typeof arg === 'function') {
          node._ref = updateNode(node, arg(props))
        }
      })
    }

    // collect attribute fields
    const attrFields = []
    for (let i = 0, n = tplNode.attributes.length; i < n; i++) {
      let {name, value} = tplNode.attributes[i]
      // <a #b.c
      if (/^#|^\.\b/.test(name)) {
        tplNode.removeAttribute(name), --i, --n;
        let [beforeId, afterId = ''] = name.split('#')
        let beforeClx = beforeId.split('.')
        name = beforeClx.shift()
        let afterClx = afterId.split('.')
        let id = afterClx.shift()
        let clx = [...beforeClx, ...afterClx]
        if (!tplNode.id && id) tplNode.id = id
        if (clx.length) clx.map(cls => tplNode.classList.add(cls))
      }
      // <a ${'hidden'}, <a ...${props}
      else if (name.includes(FIELD)) {
        tplNode.removeAttribute(name), n--, m--
        attrFields.push([fieldId++])
      }
      // <a a=${b}, <a a="b${c}d${e}f"
      else if (value.includes(FIELD)) {
        if (value === FIELD) attrFields.push([name, fieldId++])
        else (value = value.split(FIELD), attrFields.push([name, fieldId, value]), value.end = fieldId += value.length - 1)
      }
    }
    if (attrFields.length) (hasAttrs = true, tplNode.classList.add(FIELD_CLASS), tplNode._attrFields = attrFields)

    // collect children fields
    let childFields = null, i = 0, child
    while (child = tplNode.childNodes[i++]) {
      if (child.nodeType === TEXT && ~(idx = child.data.indexOf(FIELD))) {
        // querying by class is faster than traversing childNodes https://jsperf.com/queryselector-vs-prop-access
        if (!childFields) { hasChildren = true, tplNode.classList.add(FIELD_CLASS), childFields = tplNode._childFields = [] }
        child.splitText(idx).splitText(FIELD.length)
        childFields[i++] = fieldId++
      }
    }
  }

  // static template is used for short-path rendering by changing tpl directly & cloning
  const fastTpl = !hasComponents && tpl.cloneNode(true),
        fastNodes = hasFields && fastTpl.content.querySelectorAll('.' + FIELD_CLASS),
        tplNodes = hasFields && tpl.content.querySelectorAll('.' + FIELD_CLASS)

  if (fastNodes) fastNodes.forEach(node => (node.classList.remove(FIELD_CLASS), !node.className && node.removeAttribute('class')))

  function build() {
    let cleanup = [], fast = !hasComponents, frag

    // if all fields are primitives - take short path - modify fastTpl directly & clone
    // why `!immutables` and not `observable`:
    // - fn field cannot be cloned afterwards (like onclick)
    // - object field may one-way add attribs (spoil fast node) and also may have observable prop
    // - array field can insert additional children, spoiling numeration of _childFields
    if (!hasComponents) for (let i = 0; i < arguments.length; i++) if (!immutable(arguments[i])) { fast = false; break }
    frag = fast ? fastTpl : tpl.content.cloneNode(true)

    // query/apply different types of evaluators in turn
    // https://jsperf.com/getelementsbytagname-vs-queryselectorall-vs-treewalk/1
    // FIXME: try to replace with getElementsByClassName, getElementsByTagName
    if (hasFields) {
      let i = 0, node, nodes = fast ? fastNodes : frag.querySelectorAll(FIELD_CLASS), subs = !fast && []
      while ({_childFields, _attrFields} = tplNodes[i], node = nodes[i++]) {
        if (!fast) (node.classList.remove(FIELD_CLASS), !node.className && child.removeAttribute('class'))

        // eval attributes
        if (_attrFields) {
          // for (let j = 0, evals = evalAttrs[i++], evalAttr = evals[0]; j < evals.length; evalAttr = evals[++j])
          //   cleanup.push(evalAttr(child, arguments, fast))
          for (let j = 0, n = _attrFields.length, name, value; [name, value, statics] = _attrFields[j], j++ < n;) {
            // <a ${foo}
            if (value == null) {
              const arg = arguments[name]

              if (!arg) {}
              // <a ${'name'}
              else if (fast || primitive(arg)) prop(node, arg, true)
              // <a ...${props}
              else (subs = !fast && []) => {
                // no need for placeholder props
                if (observable(arg)) return sube(arg, v => { for (let key in v) prop(node, key, v[key]) })

                for (let key in arg) {
                  if (observable(arg[key])) subs.push(sube(arg[key], v => prop(node, key, v)))
                  else prop(node, key, arg[key])
                }
              }
            }
            // <a foo=bar${baz}qux
            else if (statics) {
              const fields = [].slice.call(arguments, value, statics.end)
              if (fast) return prop(node, name, h.tpl(statics, ...fields))

              subs = fields.map((field, i) => observable(field) ? (fields[i] = '', field) : null)
              prop(node, name, h.tpl(statics, ...fields))
              subs.map((sub, i) => sub && sube(sub, v => (fields[i] = v, prop(node, name, h.tpl(statics, ...fields)))))
            }
            // <a foo=${bar}
            else {
              const arg = arguments[value]
              if (fast || !observable(arg)) prop(node, name, arg)
              else {
                prop(node, name, '')
                sube(arg, v => prop(node, name, v))
              }
            }
          }
        }

        // eval children
        if (_childFields) {
          let children = []
          for (let j = 0, n = _childFields.length, fieldId; fieldId = _childFields[j], j++ < n;) {
            // fast case is guaranteed to correspond index _childFields[i] ==> node.childNodes[i]
            if (fieldId == null) children.push(node.childNodes[i])
            let arg = arguments[fieldId]
            if (arg) {
              addChildren(children, arg)
              if (!fast && observable(arg)) subs[subs.length] = arg
            }
          }
          merge(node, node.childNodes, children)
          // partial-merge only for observable fields
          if (!fast) for (let j in subs) {
            let before = children[j], prev = []
            cleanup.push(sube(arg, arg => prev = merge(node, prev, addChildren([], arg), before)))
          }
        }
      }
    }

    // assign props stash for components to collect attribs
    // if (hasComponents) {
    //   components = frag.querySelectorAll(FIELD), i = 0
    //   while (child = components[i++]) child[_ref] = {}
    // }


    // evaluate components with collected props
    // if (hasComponents) {
    //   i = 0
    //   while (child = components[i]) cleanup.push(evalComp[i++](child, arguments))
    // }

    if (fast) frag = frag.cloneNode(true).content
    return frag.childNodes.length === 1 ? frag.firstChild[_ref] || frag.firstChild : frag
  }


  return build
}

function addChildren(children, arg) {
  if (arg.nodeType) children.push(arg)
  else if (immutable(arg)) children.push(document.createTextNode(arg))
  else if (Array.isArray(arg)) {
    for (let k = 0, item, l = arg.length; item = arg[k], k++ < l;)
      children.push(immutable(item) ? document.createTextNode(item) : item)
  }
  else if (arg[Symbol.iterator]) children.push(...arg)
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

const prop = (el, name, value) => (el[name] = value, attr(el, name, value))

// ref: https://github.com/luwes/js-diff-benchmark/blob/master/libs/spect.js
export function merge (parent, a, b, end = null) {
  let bidx = new Set(b), aidx = new Set(a), i = 0, cur = a[0], next, bi

  while ((bi = b[i++]) || cur != end) {
    next = cur ? cur.nextSibling : end

    // skip (update output array if morphed)
    if (a === b || (a.key != null && a.key === b.key)) cur = next

    // insert has higher priority, inc. tail-append shortcut
    else if (bi && (cur == end || bidx.has(cur))) {
      // swap
      if (b[i] === next && aidx.has(bi)) cur = next

      // insert
      parent.insertBefore(bi, cur)
    }

    // technically redundant, but enables morphing text
    else if (bi && !aidx.has(bi)) {
      parent.replaceChild(bi, cur)
      cur = next
    }

    // remove
    else (parent.removeChild(cur), cur = next, i--)
  }

  return b
}

// 1st iteration on h21 - slow-ish, seems due to fact that

import { symbol, observable, primitive, primitive as immutable, list, attr } from '../../src/util.js'

const TEXT = 3, ELEMENT = 1, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4, SHOW_COMMENT = 128

const FIELD = 'h:::', FIELD_CLASS = 'h--eval'

const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')

const buildCache = new Map

export default function h (statics, ...fields) {
  let build

  // hyperscript - turn to tpl literal call
  // FIXME: should be Array.isTemplateObject(statics)
  if (!statics.raw) {
    let props = (fields[0] == null || fields[0].constructor === Object || observable(fields[0])) && fields.shift()

    build = buildCache.get(statics)
    if (!build) {
      // FIXME: no-props case can make static things even faster (almost as direct cloneNode)
      // h('', 'b', 'c', 'd')
      if (!statics) (buildCache.set(statics, build = createBuilder(FIELD.repeat(fields.length))), build.frag = true)
      // h('div', props?, ...children?)
      else if (primitive(statics)){
        if (EMPTY.includes(statics)) (buildCache.set(statics, build = createBuilder(`<${statics} ...${FIELD} />`)), build.empty = true)
        else (buildCache.set(statics, build = createBuilder(`<${statics} ...${FIELD}>${FIELD}</${statics}>`)))
      }
      // h(target, props?, ...children)
      else (buildCache.set(statics, build = createBuilder(`<${FIELD} ...${FIELD}>${FIELD}</>`)), build.comp = true)
    }
    return build.comp ? build(statics, props, fields) :
          build.empty ? build(props) :
          build.frag ? build(...fields) :
          build(props, fields)
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
    // >ah:::bh:::c< → >a<!--h:::-->b<!--h:::-->c<
    // comments have less html quirks than text nodes, also no need to split
    // FIXME: lookahead can be slow, but possibly can be optimized via UTF symbols
    .replace(/h:::(?=[^<>]*(?:<|$))/g, '<!--' + FIELD + '-->')
  tpl.innerHTML = str

  // getElementsByTagName('*') is faster than tree iterator/querySelector('*), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  let it = document.createNodeIterator(tpl.content, SHOW_ELEMENT | SHOW_COMMENT, null), tplNode = tpl.content, fieldId = 0,
      // FIXME: these can be detected from outside to be faster
      hasFields = str.includes(FIELD), hasComponents = str.includes('<' + FIELD)

  // fields are co-directional with node sequence in document, attributes and childNodes order, so we just increment fieldId
  while (tplNode = it.nextNode()) {
    if (tplNode.nodeType === COMMENT) {
      if (tplNode.data === FIELD) {
        tplNode._field = fieldId++
        let parent = tplNode.parentNode
        if (!parent._childFields) (parent._childFields = true, parent.classList && parent.classList.add(FIELD_CLASS))
      }
    }
    else {
      // collect component fields, like <${node}
      if (tplNode.localName === FIELD) { tplNode._compField = fieldId++, tplNode.classList.add(FIELD_CLASS) }

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
          tplNode.removeAttribute(name), n--, i--
          attrFields.push([fieldId++])
        }
        // <a a=${b}, <a a="b${c}d${e}f"
        else if (value.includes(FIELD)) {
          if (value === FIELD) attrFields.push([name, fieldId++])
          else (value = value.split(FIELD), attrFields.push([name, fieldId, value]), value.end = fieldId += value.length - 1)
        }
      }
      // querying by class is faster than traversing childNodes https://jsperf.com/queryselector-vs-prop-access
      if (attrFields.length) (tplNode._attrFields = attrFields, tplNode.classList.add(FIELD_CLASS))
    }
  }

  // static template is used for short-path rendering by changing tpl directly & cloning
  const fastTpl = !hasComponents && tpl.cloneNode(true),
        fastNodes = fastTpl && hasFields && fastTpl.content.querySelectorAll('.' + FIELD_CLASS),
        tplNodes = hasFields && tpl.content.querySelectorAll('.' + FIELD_CLASS)

  if (fastNodes) fastNodes.forEach(node => (node.classList.remove(FIELD_CLASS), !node.className && node.removeAttribute('class')))

  function build() {
    let cleanup, fast = !hasComponents, frag, arg

    // if all fields are primitives - take short path - modify fastTpl directly & clone
    // why `!immutables` and not `observable`:
    // - fn field cannot be cloned afterwards (like onclick)
    // - object field may one-way add attribs (spoil fast node) and also may have observable prop
    // - array field can insert additional children, spoiling numeration of _childFields
    if (!hasComponents) for (let i = 0; i < arguments.length; i++) if (!immutable(arguments[i])) { fast = false; break }
    frag = fast ? fastTpl : (cleanup = [], tpl.content.cloneNode(true))

    // query/apply different types of evaluators in turn
    // https://jsperf.com/getelementsbytagname-vs-queryselectorall-vs-treewalk/1
    // FIXME: try to replace with getElementsByClassName, getElementsByTagName
    if (hasFields) {
      let i = -1, nodes = fast ? fastNodes : frag.querySelectorAll('.' + FIELD_CLASS), tplNode
      while (tplNode = i<0 ? tpl.content : tplNodes[i]) {
        let node = i<0 ? frag : nodes[i], attrField, comp

        if (!fast && node.classList) {node.classList.remove(FIELD_CLASS), !node.className && node.removeAttribute('class')}

        // pre-insert target fields, parse component fields
        if (hasComponents && (comp = tplNode._compField) != null) {
          let arg = arguments[comp]
          // <${el}
          if (arg.nodeType) {
            // render tpl node children/attrs/props to the replacement
            // FIXME: try to avoid this pre-rendering
            // console.log(arguments[2][0][0], node.outerHTML)
            // merge(arg, arg.childNodes, [...node.childNodes])
            // console.log(arguments[2][0][0], node.outerHTML)
            // h`<${b}/>` - b is kept in its own parent
            if (node.parentNode.nodeType === FRAGMENT) frag = { firstChild: node = arg, childNodes: [node] }
            // h`<a><${b}/></a>` - b is placed to a
            else node.replaceWith(node = arg)
          }
          // <${Component}
          else if (typeof arg === 'function') node._comp = arg
        }

        // eval attributes
        if (attrField = tplNode._attrFields) {
          for (let j = 0, n = attrField.length; j < n; j++) {
            let [name, value, statics] = attrField[j]
            // <a ${foo}
            if (value == null) {
              if (!(arg = arguments[name])) {}
              // <a ${'name'}
              else if (fast || primitive(arg)) prop(node, arg, true)
              // <a ...${props}
              else {
                if (observable(arg)) cleanup.push(sube(arg, v => {
                  if (primitive(v)) prop(node, v, true)
                  else for (let key in v) prop(node, key, v[key])
                }))
                else for (let key in arg) {
                  if (observable(arg[key])) cleanup.push(sube(arg[key], v => prop(node, key, v)))
                  else prop(node, key, arg[key])
                }
              }
            }
            // <a foo=bar${baz}qux
            else if (statics) {
              const fields = [].slice.call(arguments, value, statics.end)
              if (fast) prop(node, name, h.tpl(statics, ...fields))
              else {
                const subs = fields.map((field, i) => observable(field) ? (fields[i] = '', true) : null)
                if (!subs.length) prop(node, name, h.tpl(statics, ...fields))
                else subs.map((sub, i) => sub &&
                  cleanup.push(sube(sub, v => (fields[i] = v, prop(node, name, h.tpl(statics, ...fields)))))
                )
              }
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
        if (tplNode._childFields) {
          const children = !fast && [], subs = !fast && []
          // FIXME: tree walker may come faster here (only by comments)
          for (let j = 0, n = tplNode.childNodes.length; j < n; j++) {
            let fieldId = tplNode.childNodes[j]._field, arg
            if (!fast) {
              if (fieldId == null) children.push(node.childNodes[j])
              else if ((arg = arguments[fieldId]) != null) addChildren(children, arg, subs)
            }
            // fast case is guaranteed to correspond index tplNode._childFields[i] ==> node.childNodes[i]
            // render immediately (fast path)
            else if (fieldId != null) {
              let child = node.childNodes[j], arg = arguments[fieldId]
              if (immutable(arg) && child.nodeType === TEXT) (child.data = arg || '')
              else (child.replaceWith(arg))
              // else merge(node, [child], addChildren([], arg), child.nextSibling)
            }
          }
          // partial-merge only for observable fields
          if (!fast) {
            merge(node, node.childNodes, children)
            for (let j in subs) {
              let before = children[j], prev = []
              cleanup.push(sube(subs[j], arg => (prev = merge(node, prev, addChildren([], arg), before))))
            }
          }
        }

        // init component
        if (hasComponents && (comp = node._comp)) {
          let result = comp(node)
          if (immutable(result) || result.nodeType) node.replaceWith(result)
          else merge(node.parentNode, [node], result, node.nextSibling)
        }

        i++
      }
    }

    if (fast) frag = frag.cloneNode(true).content
    return frag.childNodes.length === 1 ? frag.firstChild : frag
  }


  return build
}

function addChildren(children, arg, subs) {
  if (arg == null) {}
  else if (arg.nodeType) children.push(arg)
  else if (immutable(arg)) (children.push(arg = new String(arg)))
  else if (Array.isArray(arg)) for (let i = 0; i < arg.length; i++) addChildren(children, arg[i], subs)
  else if (arg[Symbol.iterator]) { children.push(...arg) }
  else if (subs && observable(arg)) subs.push(arg)
  return children
}

// interpolator
h.tpl = (statics, ...fields) => String.raw({raw: statics}, ...fields.map(value => !value ? '' : value)).trim()

// lil subscriby (v-less)
function sube(target, fn, unsub, stop) {
  if (typeof target === 'function') unsub = target(fn)
  else if (target[symbol.observable]) target[symbol.observable](({subscribe}) => unsub = subscribe({ next: fn }))
  else if (target[Symbol.asyncIterator]) {
    unsub = () => stop = true
    ;(async () => { for await (target of target) { if (stop) break; fn(target) } })()
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
    if (cur === bi || (cur && bi && cur.key && cur.key === bi.key)) cur = next

    // insert has higher priority, inc. tail-append shortcut
    else if (bi && (cur == end || bidx.has(cur))) {
      // swap
      if (b[i] === next && aidx.has(bi)) cur = next

      // insert
      parent.insertBefore(!bi.nodeType ? b[i-1] = document.createTextNode(bi) : bi, cur)
    }

    // technically redundant, but enables morphing text
    else if (bi && !aidx.has(bi)) {
      // replaceWith can take in plain strings, but can't return created node
      // cur.replaceWith(!bi.nodeType ? document.createTextNode(bi) : bi)
      cur.nodeType === TEXT && !bi.nodeType ? (cur.data = bi, b[i-1] = cur) :
      parent.replaceChild(!bi.nodeType ? (b[i-1] = document.createTextNode(bi)) : bi, cur)
      cur = next
    }

    // remove
    else (parent.removeChild(cur), cur = next, i--)
  }

  return b
}

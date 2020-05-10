import { symbol, observable, primitive, attr, slice } from './src/util.js'

// DOM
const TEXT = 3, ELEMENT = 1, ATTRIBUTE = 2, COMMENT = 8, FRAGMENT = 11, SHOW_ELEMENT = 1, SHOW_TEXT = 4, SHOW_COMMENT = 128

// placeholders
const ZWSP = '\u200B', ZWNJ = '\u200C', ZWJ = '\u200D', FIELD = '\0', FIELD_RE = /\0/g, HTML_FIELD = ZWSP

// FIXME: don't forget to turn it on
const FAST = true

// evaluate program constants
// const PROG_TAG = 1,
//       PROG_COMPONENT = 2,
//       PROG_QUERY = 3,
//       PROP_NAME = 4,
//       PROP_SPREAD = 5,
//       PROP_VALUE = 6,
//       PROP_TPL = 7,
//       PROP_STATIC = 8,
//       CHILDREN = 9
const PROG_TAG = ('PROG_TAG'),
      PROG_COMPONENT = ('PROG_COMPONENT'),
      PROG_QUERY = ('PROG_QUERY'),
      PROP_NAME = ('PROP_NAME'),
      PROP_SPREAD = ('PROP_SPREAD'),
      PROP_VALUE = ('PROP_VALUE'),
      PROP_TPL = ('PROP_TPL'),
      PROP_STATIC = ('PROP_STATIC'),
      CHILDREN = ('CHILDREN')

// character for node id, ref https://mathiasbynens.be/notes/html5-id-class
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789𘈱'
const nextChar = c => CHARS.indexOf(c) < CHARS.length - 1 ? CHARS[CHARS.indexOf(c) + 1] : String.fromCharCode(c.charCodeAt(0) + 1)

// see also https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
// const EMPTY = 'area base br col command embed hr img input keygen link meta param source track wbr ! !doctype ? ?xml'.split(' ')


const cache = new WeakMap

export default function html(statics) {
  // hyperscript redirect
  // FIXME: should be Array.isTemplateObject(statics)
  if (!statics.raw) return h.apply(null, arguments)

  let i = 0, fast = FAST, frag, build = cache.get(statics)

  if (build) return build(arguments)

  if (fast) for (i = 1; i < arguments.length; i++) if (!primitive(arguments[i])) { fast = false; break }

  // non-primitive args build template immediately
  if (!fast) return buildTemplate(arguments)

  cache.set(statics, buildTemplate)
  single.innerHTML = String.raw.apply(null, arguments)
  frag = single.firstChild
  return frag
}


function buildTemplate (args) {
  const tpl = document.createElement('template'), statics = args[0]

  // regex replace is faster, shorter and can identify node by its `<` index in string
  // FIXME: this initial part can be replaced with HTM-like parser (possibly faster?)
  let str = statics.join(FIELD)

  let ids = Array(str.length), fieldTags = [], prog = [], quotes = [], pathTracker = '', lvl = 0, childFields = {},
      prevIdx, openIdx, closeIdx, tagStr, id, tplParts = []

  // collect nodes with fields - either as attribs or children
  // getElementById is faster than node path tracking (id is path in a way) https://jsperf.com/queryselector-vs-prop-access
  str = str
    // detecting quotes from inside fields `<a name="a${b}c" ${d}>` is hard, also hiding them makes much easier to detect tags
    // but we have to keep refs to originals
    // FIXME: that can be done faster by sequence indexOf's (not sure what I meant)
    .replace(/".*?"|'.*?'/g, (match, i) => '__' + (quotes.push(match) - 1) + '__')
    // <abc /> → <abc></abc> - makes possible identifying current node level by prev `<`, also no `/` detection in labeling needed
    .replace(/<([\w:-]+)([^>]*)\/>/g, '<$1$2></$1>')
    // label tags as `<a#a><a#aa/></a><a#b><a#ba></a><a#c/>...` - slicing tail gives parent level id
    // FIXME: use replaceAll when implemented
    .replace(/</g, (_, idx, str) => {
      // </x>
      if (str[idx+1] === '/') ids[idx] = pathTracker.slice(0, --lvl)
      // <!--, <!doctype, <?xml
      else if (str[idx+1] === '!' || str[idx+1] === '?' || str[idx+1] === '!') ids[idx] = pathTracker.slice(0, lvl)
      // <x
      else (
        childFields[
          ids[idx] = (pathTracker = pathTracker.slice(0, lvl) + nextChar(pathTracker[lvl]) + pathTracker.slice(++lvl)).slice(0, lvl)
        ] = 0
      )
      return '<'
    })
    // FIXME: possible to join with prev method for faster result
    // collect nodes affected by fields
    .replace(FIELD_RE, (_,idx,str) => {
      openIdx = str.lastIndexOf('<', idx)
      if (prevIdx !== openIdx) fieldTags.push(prevIdx = openIdx)
      if (~(closeIdx = str.slice(openIdx, idx).indexOf('>'))) {
        childFields[ids[openIdx]]++
        return '<!--' + HTML_FIELD + '-->'
      }
      return HTML_FIELD
    })
    // // <> → <h:::>
    // .replace(/<(>|\s)/, '<' + FIELD + '$1')
    // // <//>, </> → </h:::>
    // .replace(/<\/+>/, '</' + FIELD + '>')
    // // <a#b.c → <a #b.c
    // .replace(/(<[\w:-]+)([#\.][^<>]*>)/g, '$1 $2')

  // analyze operations for affected nodes - will be evaluated in build VM
  for (prevIdx = 0; fieldTags.length;) {
    openIdx = fieldTags.shift(), id = ids[openIdx], tagStr = str.slice(openIdx + 1, closeIdx = str.indexOf('>', openIdx))

    let parts = tagStr.split(/\s+/), tag = parts.shift()

    // PROG_COMPONENT, n attrs, 1 field
    if (tag === HTML_FIELD) prog.push(PROG_COMPONENT, parts.length)
    // PROG_QUERY, n attrs, id
    else if (tag[0] === '#' || tag[0] === '.') prog.push(PROG_QUERY, tag, parts.length)
    // PROG_TAG, n attrs, name
    else prog.push(PROG_TAG, id, parts.length)

    parts.map(part => {
      // PROP SPREAD, 1 field
      if (part.slice(0, 3) === '...') prog.push(PROP_SPREAD)
      // PROP BOOL, 1 field
      else if (part[0] === HTML_FIELD) prog.push(PROP_NAME)
      else {
        let [name, value] = part.split('=')
        if (value) {
          // unquote
          if (!'__'.indexOf(value)) value = quotes[value.slice(2,-2)]
          // PROP VALUE name, 1 field
          if (value === HTML_FIELD) prog.push(PROP_VALUE, name)
          // PROP TPL, name, statics, N fields
          else if (value.includes(HTML_FIELD)) prog.push(PROP_TPL, name, value.split(HTML_FIELD))
          // PROP STATIC name, value
          else (prog.push(PROP_STATIC, name, value))
        }
        else prog.push(PROP_STATIC, name, value || true)
      }
    })

    // CHILDREN
    prog.push(CHILDREN, childFields[id] || 0)

    // ref https://jsperf.com/replace-vs-split-join-vs-replaceall/95
    tplParts.push(str.slice(prevIdx, openIdx), `<${tag} id="--${id}">`)
    prevIdx = closeIdx + 1
  }
  tplParts.push(str.slice(closeIdx + 1))

  // unquote
  tpl.innerHTML = tplParts.join('').replace(/__\d+__/, m => quotes[m.slice(2,-2)])

  const build = (args) => {
    let frag = tpl.content.cloneNode(true), i = 0, c, f = 1, stack = []

    // VM inspired by https://twitter.com/jviide/status/1257755526722662405, see ./test/stacker.html
    // it prepares props/children for h function
    for (; i < prog.length;) {
      c = prog[i++]

      // <a
      if (c === PROG_TAG) (stack.push(frag.getElementById('--' + prog[i++]), prog[i++] ? {} : null), stack[0].removeAttribute('id'))
      // <#x
      else if (c === PROG_QUERY) {yyy}
      // <${el}, <${Comp}
      else if (c === PROG_COMPONENT) {xxx}
      // ${'name'}
      else if (c === PROP_NAME) stack[1][args[f++]] = true
      // ...${props}
      else if (c === PROP_SPREAD) Object.assign(stack[1], args[f++])
      // name="a${value}b"
      else if (c === PROP_TPL) stack[1][prog[i++]] = tpl(prog[i++], args, f, prog[i++])
      // name=${value}
      else if (c === PROP_VALUE) console.log('val', stack[1][prog[i++]] = args[f++], args)
      // name=value
      else if (c === PROP_STATIC) stack[1][prog[i++]] = prog[i++]
      // end
      else if (c === CHILDREN) {
        let childNodes = stack[0].childNodes, count = prog[i++]
        if (count) {
          // >${child}<, >${a}${b}<
          if (count === childNodes.length) while (count--) stack.push(args[f++])
          // >a${child}b${child}c<
          else {
            // node has static content prerendered, we initialize only field comments
            for (count = 0; count < childNodes.length; count++) {
              stack.push(childNodes[count].nodeType === COMMENT && childNodes[count].data === HTML_FIELD ? args[f++] : childNodes[count])
            }
          }
        }
        // />
        h.apply(null, stack.splice(0))
      }
    }

    return frag.childNodes.length === 1 ? frag.firstChild : frag
  }

  cache.set(statics, build)

  return build(args)
}


// compact hyperscript
export function h(tag, props) {
  // render redirect
  if (typeof tag === 'string') tag = document.createElement(tag)
  if (typeof tag === 'function') {}

  let value, name
  for (name in props) {
    value = props[name]
    // primitive is more probable also less expensive than observable check
    if (primitive(value)) prop(tag, name, value)
    else if (observable(value)) {}
    else prop(el, name, value)
  }

  // merge requires slicing arguments (slowish), so when also action is known in advance, so we add directly
  // FIXME: check if that's slow indeed or we can just merge
  if (arguments.length > 2) {
    if (tag.childNodes.length) merge(tag, tag.childNodes, slice(arguments, 2))
    else {
      for (let i = 2, arg; i < arguments.length; i++) {
        arg = arguments[i]
        if (arg.nodeType || primitive(arg)) tag.append(arg)
        else if (observable(arg)) {}
        else tag.append(...arg)
      }
    }
  }

  return tag
}


const single = document.createElement('div')

function createBuilder(statics) {
  // fields order is co-directional with tree walker order, so field number can simply be incremented, avoiding regexps
  str = str.trim()
    // <> → <h:::>
    .replace(/<(>|\s)/, '<' + FIELD + '$1')
    // <abc x/> → <abc x></abc>
    .replace(/<([\w:-]+)([^<>]*)\/>/g, '<$1$2></$1>')
    // <//>, </> → </h:::>
    .replace(/<\/+>/, '</' + FIELD + '>')
    // x/> → x />
    // .replace(/([^<\s])\/>/g, '$1 />')
    // <a#b.c → <a #b.c
    .replace(/(<[\w:-]+)([#\.][^<>]*>)/g, '$1 $2')
    // >ah:::bh:::c< → >a<!--h:::-->b<!--h:::-->c<
    // comments have less html quirks than text nodes, also no need to split
    // FIXME: lookahead can be slow, but possibly can be optimized via UTF symbols
    // or maybe before join - just check prev tag
    .replace(/h:::(?=[^<>]*(?:<|$))/g, '<!--' + FIELD + '-->')

  return () => {
    // FIXME: builder pays off after ~280 nodes, no-clone parsed args + field evaluator - after ~50 nodes
    t.innerHTML = str, t.firstChild
  }

  const tpl = document.createElement('template')
  tpl.innerHTML = str

  // getElementsByTagName('*') is faster than tree iterator/querySelector('*'), but live and fragment doesn't have it
  // ref: https://jsperf.com/createnodeiterator-vs-createtreewalker-vs-getelementsby
  let it = document.createNodeIterator(tpl.content, SHOW_ELEMENT | SHOW_COMMENT, null), node, tplNodes = [], field = 0,
      hasComponents = false, hasChildren = false, hasAttributes = false
  while (node = it.nextNode()) {
    if (node.nodeType === ELEMENT) {
      // collect component fields, like <${node}
      if (node.localName === FIELD) { node._component = field++, hasComponents = true }

      // collect attribute fields
      const attrFields = []
      for (let i = 0, attr; attr = node.attributes[i++];) {
        let {name, value} = attr
        // <a #b.c
        if (/^#|^\.\b/.test(name)) {
          node.removeAttribute(name), --i;
          let [beforeId, afterId = ''] = name.split('#')
          let beforeClx = beforeId.split('.')
          name = beforeClx.shift()
          let afterClx = afterId.split('.')
          let id = afterClx.shift()
          let clx = [...beforeClx, ...afterClx]
          if (!node.id && id) node.id = id
          if (clx.length) clx.map(cls => node.classList.add(cls))
        }
        // <a ${'hidden'}, <a ...${props}
        else if (name.includes(FIELD)) {
          node.removeAttribute(name), --i
          attrFields.push([field++, value])
        }
        // <a a=${b}, <a a="b${c}d${e}f"
        else if (value.includes(FIELD)) {
          if (value === FIELD) attrFields.push([name, field++, true])
          else (value = value.split(FIELD), attrFields.push([name, field, value]), field += value.length - 1)
        }
      }
      if (attrFields.length) hasAttributes = !!(node._attibutes = attrFields)

      // add indexes to childNodes
      for (let child = node.firstChild, i = 0; child; child = child.nextSibling) {
        if (!node._children && child.nodeType === COMMENT && child.data === FIELD) (hasChildren = true, node._children = [])
        child._id = i++
      }

      // querying by class is faster than traversing childNodes https://jsperf.com/queryselector-vs-prop-access
      if (node._component || node._children || node._attibutes) (tplNodes.push(node), node.classList.add(FIELD_CLASS))
    }
    else if (node.data === FIELD) node.parentNode._children[node._id] = (node._field = field++)
  }


  // fast template is used for short-path rendering by changing tpl directly & cloning
  let fastEvaluate, fastNodes, fastFrag

  return function build() {
    // FIXME: first node can be made fast as so:
    return tpl.content

    let cleanup, fast = !hasComponents, frag, nodes
    // if all fields are primitives - take short path - modify fastTpl directly & clone
    // why `!immutables` and not `observable`:
    // - fn field cannot be cloned afterwards (like onclick)
    // - object field may one-way add attribs (spoil fast node) and also may have observable prop
    // - array field can insert additional children, spoiling numeration of _childFields
    if (!hasComponents) for (let i = 0; i < arguments.length; i++) if (!immutable(arguments[i])) { fast = false; break }

    if (fast) {
      if (!fastEvaluate) {
        // fields are co-directional with node sequence in document, attributes and childNodes order, so we just increment fieldId
        fastEvaluate = new Function('frag', 'nodes', 'args', '_', `let node, child, attr\n` + tplNodes.map((tplNode, nodeId) => {
          let result = ``

          if (tplNode._attibutes) tplNode._attibutes.forEach(([name, value, statics]) => {
            if (statics) {
              // <a foo=${bar}
              if (statics === true) {
                const fieldId = value
                result += `_.prop(nodes[${nodeId}], '${esc(name)}', args[${fieldId}])\n`
                // const arg = arguments[value]
                // if (fast || !observable(arg)) prop(node, name, arg)
                // else {
                //   prop(node, name, '')
                //   sube(arg, v => prop(node, name, v))
                // }
              }
              // <a foo=bar${baz}qux
              else {
                const start = value
                result += `_.prop(nodes[${nodeId}], '${esc(name)}', \`${join(statics, i => '${args[' + (start + i) + ']}')}\`)\n`
                // const fields = [].slice.call(arguments, value, statics.end)
                // if (fast) prop(node, name, h.tpl(statics, ...fields))
                // else {
                //   const subs = fields.map((field, i) => observable(field) ? (fields[i] = '', true) : null)
                //   if (!subs.length) prop(node, name, h.tpl(statics, ...fields))
                //   else subs.map((sub, i) => sub &&
                //     cleanup.push(sube(sub, v => (fields[i] = v, prop(node, name, h.tpl(statics, ...fields)))))
                //   )
                // }
              }
            }
            // <a ${foo}
            else {
              if (!(arg = arguments[name])) {}
              // <a ${'name'}
              else if (fast || primitive(arg)) prop(node, arg, value)
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
          })

          if (tplNode._children) tplNode._children.forEach((fieldId, childId) => {
            if (fieldId == null) return
            result += `child = nodes[${nodeId}].childNodes[${childId}]\n` +
              `if (child.nodeType === ${TEXT}) child.data = args[${fieldId}]\n` +
              `else child.replaceWith(args[${fieldId}])\n`
          })

          return result
        }).join('\n'))
        // console.log(fastEvaluate)
        fastFrag = tpl.content.cloneNode(true)
        fastNodes = fastFrag.querySelectorAll('.' + FIELD_CLASS)
        fastNodes.forEach(node => (node.classList.remove(FIELD_CLASS), !node.className && node.removeAttribute('class')))
      }
      fastEvaluate(frag, fastNodes, arguments, util)
      frag = fastFrag.cloneNode(true)
    }
    else {
      cleanup = []
      frag = tpl.content.cloneNode(true)
      nodes = frag.querySelectorAll('.' + FIELD_CLASS)
      evaluate(frag, nodes, arguments, util)
    }

    // query/apply different types of evaluators in turn
    // https://jsperf.com/getelementsbytagname-vs-queryselectorall-vs-treewalk/1
    // FIXME: try to replace with getElementsByClassName, getElementsByTagName
    /*
    if (hasFields) {
      let i = -1, tplNode
      while (tplNode = i<0 ? tpl.content : tplNodes[i]) {
        let node = i<0 ? frag : nodes[i], attrField, comp

        if (!fast && node.classList) {node.classList.remove(FIELD_CLASS), !node.className && node.removeAttribute('class')}

        // pre-insert target fields, parse component fields
        if (hasComponents && (comp = tplNode._compField) != null) {
          let arg = arguments[comp]
          comp = null
          // <${el}
          if (arg.nodeType) {
            // render tpl node children/attrs/props to the replacement
            // FIXME: try to avoid this pre-rendering
            merge(arg, arg.childNodes, [...node.childNodes])
            for (let attr, i = 0; attr = node.attributes[i++];) prop(arg, attr.name, attr.value)
            // h`<${b}/>` - b is kept in its own parent
            if (node.parentNode.nodeType === FRAGMENT) frag = { firstChild: node = arg, childNodes: [node] }
            // h`<a><${b}/></a>` - b is placed to a
            else node.replaceWith(node = arg)
          }
          // <${Component}
          else if (typeof arg === 'function') {
            comp = { component: arg }
            for (let attr, i = 0; attr = node.attributes[i++];) prop(comp, attr.name, attr.value)
          }
        }

        // eval attributes
        if (attrField = tplNode._attrFields) {
          for (let j = 0, n = attrField.length; j < n; j++) {
            let [name, value, statics] = attrField[j]
            if (statics) {
              // <a foo=${bar}
              if (statics === true) {
                const arg = arguments[value]
                if (fast || !observable(arg)) prop(node, name, arg)
                else {
                  prop(node, name, '')
                  sube(arg, v => prop(node, name, v))
                }
              }
              // <a foo=bar${baz}qux
              else {
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
            }
            // <a ${foo}
            else {
              if (!(arg = arguments[name])) {}
              // <a ${'name'}
              else if (fast || primitive(arg)) prop(node, arg, value)
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
          }
        }

        // eval children
        if (tplNode._childFields) {
          if (fast) {
            let j = 0, tplChild = tplNode.firstChild, fieldId
            while (tplChild) {
              // fast case is guaranteed to correspond index tplNode._childFields[i] ==> node.childNodes[i], so it's simpler than merge
              if ((fieldId = tplChild._field) != null) {
                let child = node.childNodes[j], arg = arguments[fieldId]
                if (child.nodeType === TEXT) (child.data = arg == null ? '' : arg)
                else (child.replaceWith(arg == null ? document.createTextNode('') : arg))
              }
              tplChild = tplChild.nextSibling, j++
            }
          }
          else {
            let children = [], subs = []
            for (let j = 0, n = tplNode.childNodes.length; j < n; j++) {
              let fieldId = tplNode.childNodes[j]._field, arg
              if (fieldId == null) children.push(node.childNodes[j])
              else if ((arg = arguments[fieldId]) != null) addChildren(children, arg, subs)
            }
            // partial-merge only for observable fields
            merge(node, node.childNodes, children)
            for (let j in subs) {
              let before = children[j], prev = []
              cleanup.push(sube(subs[j], arg => (prev = merge(node, prev, addChildren([], arg), before))))
            }
          }
        }

        // init component
        if (hasComponents && comp) {
          let result = comp.component(comp)
          if (immutable(result) || result.nodeType) node.replaceWith(result)
          else merge(node.parentNode, [node], result, node.nextSibling)
        }

        i++
      }
    }
    */

    return frag.childNodes.length === 1 ? frag.firstChild : frag
  }
}


function addChildren(children, arg, subs) {
  if (arg == null) {}
  else if (arg.nodeType) children.push(arg)
  else if (immutable(arg)) (children.push(arg = new String(arg)))
  else if (Array.isArray(arg)) for (let i = 0; i < arg.length; i++) addChildren(children, arg[i], subs)
  else if (arg[Symbol.iterator]) { children.push(...arg) }
  else if (subs && observable(arg)) subs[children.length] = arg
  return children
}

// interpolator
const tpl = (statics, args, from, to) => String.raw({raw: statics}, ...fields.map(value => !value ? '' : value)).trim()

// join an array with a function
const join = (arr, fn) => {
  let str = '', i = 0
  for (; i < arr.length - 1; i++) str += arr[i] + fn(i)
  return str += arr[i]
}

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

const prop = (el, name, value) => attr(el, name, el[name] = value)

// test/libs/spect-inflate.js
const merge = (parent, a, b, end = null) => {
  let i = 0, cur, next, bi, n = b.length, m = a.length

  // skip head/tail
  while (i < n && i < m && a[i] == b[i]) i++
  while (i < n && i < m && b[n-1] == a[m-1]) end = b[--m, --n]

  // append/prepend/trim shortcuts
  if (i == m) while (i < n) insert(parent, b[i++], end)
  if (i == n) while (i < m) parent.removeChild(a[i++])

  else {
    cur = a[i]

    while (i < n) {
      bi = b[i++], next = cur ? cur.nextSibling : end

      // skip
      if (cur == bi) cur = next

      // swap / replace
      else if (i < n && b[i] == next) (replace(parent, cur, bi), cur = next)

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
    else if (a.nodeType) parent.insertBefore(a, b)
    else for (a of a) parent.insertBefore(a, b)
  }
}

// WARN: the order is different from replaceNode(new, old)
const replace = (parent, from, to, end) => {
  if (to != null) {
    if (primitive(to)) {
      if (from.nodeType === TEXT) from.data = to; else from.replaceWith(to)
    }
    else if (to.nodeType) parent.replaceChild(to, from)
    // FIXME: make sure no slice needed here
    else merge(parent, [from], to, end)
  }
}

const util = { prop, merge }

// html effect
import htm from 'htm'
import { patch,
  elementOpen,
  elementClose,
  elementVoid,
  text,
  attributes,
  symbols,
  applyProp,
  applyAttr,
  skip,
  currentElement
} from 'incremental-dom'
import $, { currentTarget, currentState } from './spect.js'
import { } from './util.js'


// configure incremental-dom
attributes.class = applyAttr
attributes[symbols.default] = applyProp


// build vdom
html.h = function h(target, props, ...children) {
  let [beforeId, afterId = ''] = target.split('#')
  let [tag, ...beforeClx] = beforeId.split('.')
  let [id, ...afterClx] = afterId.split('.')
  let clx = [...beforeClx, ...afterClx]

  // figure out effects: array props, anonymous aspects or child functions
  let aspects = [], propsArr = []
  for (let prop in props) {
    let val = props[prop]
    if (typeof val === 'function' && /[0-9]+/.test(prop)) aspects[parseInt(prop)] = val
    else propsArr.push(prop, val)
  }
  if (children.length) children = children.filter(child => {
    if (typeof child !== 'function') return true
    aspects.push(child)
  })

  let staticProps = []
  if (id) staticProps.push('id', id)
  if (clx.length) staticProps.push('class', clx.join(' '))

  let key = id || (props && (props.id || props.key))

  // FIXME: use more static props, like type
  return {
    tag,
    key,
    aspects,
    props: propsArr,
    staticProps,
    children: children.length ? children : null
  }
}

html.htm = htm.bind(html.h)


// render vdom
html.render = function render (arg) {
  if (!arg) return

  // numbers/strings serialized as text
  if (typeof arg === 'number') return text(arg)
  if (typeof arg === 'string') return text(arg)

  if (arg.ref) {
    elementOpen('ref', arg.ref, ['id', arg.ref])
    skip()
    elementClose('ref')
    return
  }

  if (arg.length) return [...arg].forEach(render)

  // objects create elements
  let { tag, key, props, staticProps, children, aspects } = arg

  // fragment
  // FIXME: seems that unreal case
  if (!tag) return children.forEach(render)

  let el
  if (!children) el = elementVoid(tag, key, staticProps, ...props)
  else {
    elementOpen(tag, key, staticProps, ...props)
      children.forEach(render)
    elementClose(tag)
  }

  // register aspects
  let state = currentState
  aspects.forEach(aspect => state.htmlAfter.push([el, aspect]))
}


export default function html(...args) {
  let cache = currentState.htmlCache || (currentState.htmlCache = new WeakMap())

  // tpl string
  let vdom
  if (args[0].raw) vdom = html.htm(...args)

  // direct JSX
  else vdom = args[0]
  if (!Array.isArray(vdom)) vdom = [vdom]

  // put DOM nodes aside
  let count = 0, refs = {}

  vdom = vdom.map(function map(arg) {
    if (arg instanceof Array) return arg.map(map)

    if (arg instanceof NodeList) {
      // cache initial nodes contents
      if (!cache.has(arg)) cache.set(arg, [...arg])

      // put nodes aside into fragment, to reinsert after re-rendered wrapper
      let frag = document.createDocumentFragment()
      cache.get(arg).forEach(arg => frag.appendChild(arg))
      let id = 'frag-' + count++
      refs[id] = frag
      return {ref: id}
    }
    if (arg instanceof Node) {
      arg.remove()
      let id = 'el-' + count++
      refs[id] = arg
      return {ref: id}
    }

    if (arg.children) arg.children = map(arg.children)

    return arg
  })

  // incremental-dom
  currentState.htmlAfter = []
  patch(currentTarget, html.render, vdom)

  // reinsert nodes
  for (let id in refs) {
    let frag = refs[id]
    let holder = currentTarget.querySelector('#' + id)
    holder.replaceWith(frag)
  }

  // init aspects
  let newAspects = currentState.htmlAfter
  currentState.htmlAfter = null
  newAspects.forEach(([el, fn]) => $(el, fn))

  return currentTarget.childNodes.length === 1 ? currentTarget.firstChild : currentTarget.childNodes
}

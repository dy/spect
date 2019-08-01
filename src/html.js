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
import $ from '..';


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
  let fx, propsArr = []
  for (let prop in props) {
    let val = props[prop]
    // <div fx=${fx} />
    if (prop === 'fx') fx = Array.isArray(val) ? val : [val]
    // <div ...${fx} />
    // if (typeof val === 'function' && /[0-9]+/.test(prop)) fx[parseInt(prop)] = val
    else propsArr.push(prop, val)
  }
  if (children.length) children = children.filter(child => {
    if (typeof child !== 'function') return true
    // fx.push(child)
  })

  let staticProps = []
  if (id) staticProps.push('id', id)
  if (clx.length) staticProps.push('class', clx.join(' '))

  let key = id || (props && (props.id || props.key))

  // FIXME: use more static props, like type
  return {
    tag,
    key,
    fx,
    props: propsArr,
    staticProps,
    children: children.length ? children : null
  }
}

html.htm = htm.bind(html.h)

export default function html(...args) {
  // let cache = currentState.htmlCache || (currentState.htmlCache = new WeakMap())

  // tpl string
  let vdom
  if (args[0].raw) vdom = html.htm(...args)

  // fn renderer html(h => h(...))
  else if (typeof args[0] === 'function') vdom = args[0](html.h)

  // direct JSX
  else vdom = args[0]

  if (!Array.isArray(vdom)) vdom = [vdom]

  // put DOM nodes aside
  // let count = 0, refs = {}

  // vdom = vdom.map(function map(arg) {
  //   if (arg instanceof Array) return arg.map(map)

  //   if (arg instanceof NodeList) {
  //     // cache initial nodes contents
  //     if (!cache.has(arg)) cache.set(arg, [...arg])

  //     // put nodes aside into fragment, to reinsert after re-rendered wrapper
  //     let frag = document.createDocumentFragment()
  //     cache.get(arg).forEach(arg => frag.appendChild(arg))
  //     let id = 'frag-' + count++
  //     refs[id] = frag
  //     return {ref: id}
  //   }
  //   if (arg instanceof Node) {
  //     arg.remove()
  //     let id = 'el-' + count++
  //     refs[id] = arg
  //     return {ref: id}
  //   }

  //   if (arg.children) arg.children = map(arg.children)

  //   return arg
  // })

  // incremental-dom
  let afterFx = []

  this.forEach(el => patch(el, render, vdom))

  function render (arg) {
    if (!arg) return

    // numbers/strings serialized as text
    if (typeof arg === 'number') return text(arg)
    if (typeof arg === 'string') return text(arg)

    // real dom nodes
    // if (arg.ref) {
    //   elementOpen('ref', arg.ref, ['id', arg.ref])
    //   skip()
    //   elementClose('ref')
    //   return
    // }

    // FIXME: .length can be wrong check
    if (arg.length) return [...arg].forEach(arg => render(arg))

    // objects create elements
    let { tag, key, props, staticProps, children, fx } = arg

    // fragment (direct vdom)
    if (!tag) return children.forEach(render)

    let el
    if (!children) el = elementVoid(tag, key, staticProps, ...props)
    else {
      el = elementOpen(tag, key, staticProps, ...props)
      children.forEach(render)
      elementClose(tag)
    }

    // plan aspects init
    if (fx) afterFx.push([el, fx])
  }

  // reinsert nodes
  // for (let id in refs) {
  //   let frag = refs[id]
  //   let holder = currentTarget.querySelector('#' + id)
  //   holder.replaceWith(frag)
  // }

  // init aspects
  afterFx.forEach(([el, fx]) => fx.forEach(fx => $(el).fx(fx)))

  // return currentTarget.childNodes.length === 1 ? currentTarget.firstChild : currentTarget.childNodes
}

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
  skipNode,
  skip,
  currentElement,
  currentPointer
} from 'incremental-dom'
import { currentTarget, currentState } from './spect.js'
import { } from './util.js'

attributes.class = applyAttr
attributes[symbols.default] = applyProp


// cache of vdom states assigned to elements
let cache = new WeakMap

html.h = function h(target, props, ...children) {
  // DOM targets get their props / content updated
  // if (target instanceof Node) {
  //   if (!tracking.has(target)) tracking.set(target, toVNode(target))
  //   let oldVnode = tracking.get(target)
  //   let newVNode = snabH(oldVnode.sel, {props}, children)
  //   tracking.set(target, patch(oldVnode, newVNode))
  //   return target
  // }

  //  register web-component
  // if (typeof target === 'function') {
  //   if (!tracking.has(target)) {
  //     // TODO: differentiate class / function
  //     tracking.set(target, createComponent(target, props, children))
  //   }
  //   let { tagName } = tracking.get(target)

  //   return snabH(tagName, props, children)
  // }


  // fragment targets return array
  // if (target === '') return children

  // nested fragments create nested arrays
  // children = children.flat()

  // return snabH(target, {props}, children)

  if (target instanceof Node || target instanceof NodeList) {
    // if unchanged node is passed - cache it as initial content to skip
    if (!cache.has(target)) cache.set(target, [].concat(target))
    return target
  }

  let [beforeId, afterId = ''] = target.split('#')
  let [tag, ...beforeClx] = beforeId.split('.')
  let [id, ...afterClx] = afterId.split('.')
  let clx = [...beforeClx, ...afterClx]

  let staticProps = []
  if (id) staticProps.push('id', id)
  if (clx.length) staticProps.push('class', clx)

  let key = id || (props && (props.id || props.key))

  // FIXME: use more static props, like type
  return {
    tag,
    key,
    props: props && Object.entries(props).flat(),
    staticProps,
    children: children.length ? children : null
  }
}

html.htm = htm.bind(html.h)

// build DOM from arguments
export function render (arg) {
  if (!arg) return

  // numbers/strings serialized as text
  if (typeof arg === 'number') return text(arg)
  if (typeof arg === 'string') return text(arg)

  if (arg.frag) {
    const el = elementOpen('x')
      skip()
    elementClose('x')
  //   return
  //   // if (arg === currentPointer()) skipNode()
  //   // // currentElement().appendChild(arg)
    // currentElement().insertBefore(arg, currentPointer())
  //   // console.log(currentElement().innerHTML)
    return
  }

  if (arg.length) return [...arg].forEach(render)

  // objects create elements
  let { tag, key, props, staticProps, children } = arg
  if (!children) return elementVoid(tag, props)

  // fragments
  if (!tag) return children.forEach(render)

  // direct element
  elementOpen(tag, key, staticProps, ...props)
  children.forEach(render)
  elementClose(tag)


  // if (isVdom(arg)) return arg

  // if (arg.raw) {
  //   // html bypasses insertions, so if there's NodeList or Node we have to map again via vhtml
  //   let result = html.htm(...arguments)
  //   if (Array.isArray(result)) return result.map(vhtml).flat()
  //   return result
  // }

  // if (Array.isArray(arg)) return arg.map(vhtml).flat()

  // if (arg instanceof NodeList) {
  //   if (!cache.has(arg)) cache.set(arg, vhtml([...arg]))
  //   return cache.get(arg)
  //   return [...arg]
  // }

  // if (arg instanceof Node) {
  //   // if (!cache.has(arg)) cache.set(arg, toVNode(arg))
  //   // return cache.get(arg)
  //   return arg
  // }

  // return html.htm(args)
}

export default function html(...args) {
  // preserve childNodes insertions
  args = args.map(arg => {
    if (arg instanceof NodeList) {
      let frag = [...arg].map(arg => (arg._initial = true, arg))
      return { frag }
    }
    return arg
  })

  // incremental-dom
  patch(currentTarget, render, html.htm(...args))

  // post-processing


  // nanomorph
  // let vdom = vhtml(...arguments)
  // let el = document.createElement(currentTarget.tagName)
  // vdom.forEach(e => {
  //   if (Array.isArray(e)) e.forEach(e => el.appendChild(e))
  //   el.appendChild(typeof e === 'string' ? document.createTextNode(e) : e)
  // })
  // morph(currentTarget, el)

  // snabbdom
  // if (!currentState.vdom) currentState.vdom = toVNode(currentTarget)

  // // FIXME: check for <host> element to avoid that
  // // if (Array.isArray(vdom)) vdom =
  // vdom = snabH(currentState.vdom.sel, currentState.vdom.data, vdom)

  // currentState.vdom = html.patch(currentState.vdom, vdom)


  return currentTarget.childNodes.length === 1 ? currentTarget.firstChild : currentTarget.childNodes
}

function raw(content) {
  const el = elementOpen('html-blob');
  if (el.__cachedInnerHtml !== content) {
    el.__cachedInnerHtml = content;
    // el.innerHTML = content;
    if (content.length) content.forEach(c => el.appendChild(c))
  }
  skip()
  elementClose('html-blob');
}

function isVdom (arg) {
  return arg.sel !== undefined
}

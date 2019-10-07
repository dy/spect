// selector-observer based impl
import { observe } from 'selector-observer'
import { fire } from './on'
import html from './html'
import { isRenderable, isElement } from './util'

export default function use(selector, fn) {
  let resolve
  let p = new Promise(ok => { resolve = ok })

  let observer = observe(selector, {
    initialize(el) {
      fire(el, 'init', {selector})

      el = apply(el, [fn])

      resolve(el)
      p = new Promise(ok => { resolve = ok })
      destroy.then = p.then.bind(p)
    },
    add(el) {
      fire(el, 'connected', {selector})
    },
    remove(el) {
      fire(el, 'disconnected', {selector})
    }
  })

  function destroy() { observer.abort() }
  destroy.then = p.then.bind(p)
  return destroy
}

// run use
export function apply(el, uselist) {
  if (!uselist) uselist = [el.is, el.use].flat().filter(Boolean).filter(f => typeof f === 'function')

  let fn, result, props = {}
  let proto = el.constructor.prototype

  // custom non-prototype props
  for (let prop in el) {
    if (prop in proto) continue
    if (prop[0] === '_') continue
    props[prop] = el[prop]
  }

  // attributes
  for (let attr of el.attributes) {
    if (!(attr.name in props)) props[attr.name] = attr.value
  }

  // FIXME: there can also be just prototype props modified

  while (fn = uselist.shift()) {
    result = fn(el, props)
    if (result !== undefined && result !== el && isRenderable(result)) {
      let frag = html`<>${ result }</>`
      result = frag.childNodes.length > 1 ? [...frag.childNodes] : frag.firstChild
      el.replaceWith(frag)
      el = result
    }
  }

  return el
}

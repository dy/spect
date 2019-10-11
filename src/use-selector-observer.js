// selector-observer based impl
import { observe } from 'selector-observer'
import { fire } from './on'
import html from './html'
import { isRenderable, isElement } from './util'


export default function use(selector, fn, props) {
  let resolve
  if (isElement(selector)) {
    init(selector)
    return () => {}
  }

  let destroy, p = new Promise(ok => { resolve = ok })
  let observer = observe(selector, {
      initialize(el) {
        init(el)
      },
      add(el) {
        fire(el, 'connected', {selector})
      },
      remove(el) {
        fire(el, 'disconnected', {selector})
      }
    })
  destroy = () => observer.abort()
  destroy.then = p.then.bind(p)

  function init (el) {
    fire(el, 'init', { selector })
    el = apply(el, [fn], props)
    if (resolve) {
      resolve(el)
      p = new Promise(ok => { resolve = ok })
      destroy.then = p.then.bind(p)
    }
  }

  return destroy
}

// run use
export function apply(el, uselist, props) {
  if (!uselist) uselist = [el.is, el.use].flat().filter(Boolean).filter(f => typeof f === 'function')

  let fn, result

  if (!props) props = collectProps(el)

  while (fn = uselist.shift()) {
    result = fn(el, props)
    if (result !== undefined && result !== el && isRenderable(result)) {
      let frag = html`<>${ result }</>`
      result = frag.childNodes.length > 1 ? [...frag.childNodes] : frag.firstChild
      if (el.replaceWith) el.replaceWith(frag)
      el = result
    }
  }

  return el
}

export function collectProps(el) {
  let props = {}
  let proto = el.constructor.prototype

  // custom non-prototype props
  for (let prop in el) {
    if (prop in proto) continue
    if (prop[0] === '_') continue
    props[prop] = el[prop]
  }

  // attributes
  if (el.attributes) {
    for (let attr of el.attributes) {
      if (!(attr.name in props)) props[attr.name] = attr.value
    }
  }

  // FIXME: collect from propsCache as well

  // FIXME: there can also be just prototype props modified

  return props
}

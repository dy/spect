// selector-observer based impl
import { observe } from 'selector-observer'
import { fire } from './on'
import html from './html'
import { isRenderable } from './util'

export default function use(selector, fn) {
  let resolve
  let p = new Promise(ok => { resolve = ok })

  let observer = observe(selector, {
    initialize(el) {
      fire(el, 'init', {selector})

      let props = {}
      for (let attr of el.attributes) {
        props[attr.name] = attr.value
      }

      let result = fn(el, props)

      // non-zero results are treated as mappers
      if (result !== undefined && result !== el && isRenderable(result)) {
        let frag = html`<>${ result }</>`
        result = frag.childNodes.length > 1 ? [...frag.childNodes] : frag.firstChild
        el.replaceWith(frag)
        el = result
      }
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

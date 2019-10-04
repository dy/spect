// selector-observer based impl
import { observe } from 'selector-observer'
import { fire } from './on-delegated'
import { html } from '.'

export default function use(selector, fn) {
  let resolve
  let p = new Promise(ok => { resolve = ok })

  let { abort } = observe(selector, {
    initialize(el) {
      fire(el, 'init', {selector})

      let props = {}
      for (let attr of el.attributes) {
        props[attr.name] = attr.value
      }

      let result = fn(el, props)

      // non-zero results are treated as mappers
      if (result !== undefined) {
        el.replaceWith(html`<>${result}</>`)
      }

      resolve({ abort })
    },
    add(el) {
      fire(el, 'connected', {selector})
    },
    remove(el) {
      fire(el, 'disconnected', {selector})
    }
  })

  return {
    abort,
    then: p.then.bind(p)
  }
}

// selector-observer based impl
import { observe } from 'selector-observer'
import { fire } from './on-delegated'
import tuple from 'immutable-tuple'

const cache = new WeakMap
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
      cache.set(tuple(el, fn), fn(el, props))

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

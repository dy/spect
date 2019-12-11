import { observe } from 'selector-observer'
import enhook from 'enhook'
import globalCache from 'global-cache'
import tuple from 'immutable-tuple'

let cache = globalCache.get('__spect__')
if (!cache) globalCache.set('__spect__', cache = { selectors: new Map, instances: new WeakSet })

const { selectors, instances } = cache

export default function spect(target, fn) {
  if (Array.isArray(fn)) {
    fn.forEach(fn => spect(target, fn))
    return
  }

  if (typeof target === 'string') {
    return $(target, fn)
  }

  if (target.forEach) {
    target.forEach(target => spect(target, fn))
    return
  }

  let key = tuple(target, fn)

  if (!instances.has(key)) {
    instances.add(key)
    enhook(fn)(target)
  }
}


export function $(selector, fn) {
  if (Array.isArray(fn)) {
    fn.forEach(fn => spect(selector, fn))
    return
  }

  fn = enhook(fn)

  let isFirst = false

  if (!selectors.has(selector)) {
    selectors.set(selector, [])
    isFirst = true
  }

  selectors.get(selector).push(fn)

  if (isFirst) {
    let observers = selectors.get(selector)
    observe(selector, {
      initialize(el) {
        observers.forEach(fn => {
          let key = tuple(el, fn)
          if (instances.has(key)) return

          instances.add(key)
          fn(el)

          // duplicate event since it's not emitted
          el.dispatchEvent(new CustomEvent('connected'))
        })
      }
    })
  }
}

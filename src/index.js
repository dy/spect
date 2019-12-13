import { observe } from 'selector-observer'
import enhook from 'enhook'
import globalCache from 'global-cache'
import tuple from 'immutable-tuple'

let cache = globalCache.get('__spect__')
if (!cache) globalCache.set('__spect__', cache = { selectors: new Map, instances: new WeakSet })

const { selectors, instances } = cache

// element-based aspect
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

  return run(target, fn)
}

// selector-based aspect
export function $(selector, fn) {
  if (Array.isArray(fn)) {
    fn.forEach(fn => spect(selector, fn))
    return
  }

  let isFirst = false

  if (!selectors.has(selector)) {
    selectors.set(selector, [])
    isFirst = true
  }

  selectors.get(selector).push(fn)

  if (isFirst) {
    let observers = selectors.get(selector)
    observe(selector, {
      add(el) {
        observers.forEach(fn => {
          run(el, fn)

          // duplicate event since it's not emitted
          el.dispatchEvent(new CustomEvent('connected'))
        })
      },
      remove(el) {
        observers.forEach(fn => {

        })
      }
    })
  }
}

export function run(el, fn) {
  let key = tuple(el, fn)

  if (!instances.has(key)) {
    instances.set(key, enhook(fn)(el))
  }

  return () => {
    let dispose = instances.get(key)
    if (dispose && dispose.call) dispose()
    instances.delete(key)
  }
}

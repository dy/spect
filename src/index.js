import { observe } from 'selector-observer'
import enhook from 'enhook'
import globalCache from 'global-cache'
import tuple from 'immutable-tuple'
import reraf from 'reraf'

let instances = globalCache.get('__spect__')
if (!instances) globalCache.set('__spect__', instances = new WeakMap)

let raf = reraf()

// element-based aspect
export default function spect(target, fn) {
  if (Array.isArray(fn)) {
    let offs = fn.map(fn => spect(target, fn))
    return () => offs.map(off => off())
  }

  if (typeof target === 'string') {
    return $(target, fn)
  }

  if (target.forEach) {
    let offs = target.map(target => spect(target, fn))
    return () => offs.map(off => off())
  }

  return run(target, fn)
}

// selector-based aspect
export function $(selector, fn) {
  if (Array.isArray(fn)) {
    fn.forEach(fn => spect(selector, fn))
    return
  }

  return observe(selector, {
    initialize() {
      let unrun
      return {
        add(el) {
          if (el._abortUnrun) return el._abortUnrun()

          unrun = run(el, fn)

          // duplicate event since it's not emitted
          el.dispatchEvent(new CustomEvent('connected'))
        },
        remove(el) {
          // disposal is scheduled, because some elements may be asynchronously reinserted, eg. material hoistMenuToBody etc.
          el._abortUnrun = raf(unrun)
        }
      }
    }
  }).abort
}

export function run(el, fn) {
  let key = tuple(el, fn)

  if (!instances.has(key)) {
    let instance = { aspect: enhook(fn) }
    instances.set(key, instance)
    instance.dispose = instance.aspect(el)
  }

  return () => {
    let { aspect, dispose } = instances.get(key)
    if (dispose && dispose.call) dispose()
    instances.delete(key)
    aspect.unhook()
  }
}

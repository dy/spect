import kebab from 'kebab-case'
import equal from 'fast-deep-equal'
import on, { fire } from './on'
import tuple from 'immutable-tuple'
import { current, queue } from './core'

export const SPECT_CLASS = '👁'

export function isIterable(val) {
  if (val instanceof Node) return false
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export function isPrimitive(val) {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
}

export function isElement (arg) {
  return typeof arg === 'object' && arg && 'ownerDocument' in arg
}

export function isRenderable (arg) {
  if (arg === undefined) return false
  return arg === null || isPrimitive(arg) || Array.isArray(arg) || isElement(arg)
}

const storeCache = new WeakMap()
export function createEffect(name, get, set) {
  let _ = {
    [name]: (target, ...args) => {
      let store = storeCache.get(tuple(name, target))

      if (!store) {
        let curr = get(target)

        store = new Proxy(curr, {
          get(store, prop, receiver) {
            let f = current
            if (f) {
              on(target, name + ':' + prop, () => queue(f))
            }
            return Reflect.get(store, prop, receiver)
          },
          set(store, prop, value, receiver) {
            set(target, { [prop]: value })
            fire(target, name + ':' + prop)
            return Reflect.set(store, prop, value, receiver)
          }
        })

        storeCache.set(tuple(name, target), store)
      }

      switch(true) {
        // effect(target)
        case (!args.length):
          return store

        // effect`...`
        // case (args[0].raw):
        //   return template.call(target, target, ...args)
        //

        // effect(target, s => {...})
        case (typeof args[0] === 'function'):
          let fn = args[0]
          let result = fn(store)
          if (result !== store && typeof result === typeof store) {
            _[name](target, result)
          }
          return store

        // effect(target, obj)
        case (typeof args[0] === 'object'):
          let obj = args[0]
          let changed = {}
          for (let prop in obj) {
            let value = obj[prop]
            if (equal(store[prop], value)) continue
            fire(target, name + ':' + prop)
            store[prop] = value
            changed[prop] = obj[prop]
          }
          set(target, changed)
          return store
      }
    }
  }

  return _[name]
}

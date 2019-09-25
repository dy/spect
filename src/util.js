import kebab from 'kebab-case'
import equal from 'fast-deep-equal'
import tuple from 'immutable-tuple'
import introspected from 'introspected'
import { subscribe, publish } from './core'

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

export function isPrimitive(arg) {
  try { new WeakSet([arg]); return false } catch (e) {
    return true
  }
}

const storeCache = new WeakMap()
export function createEffect(get) {
  let name = get.name
  let _ = {
    [name]: (target, ...args) => {
      let key = tuple(target, name)
      let curr = get(target)
      let store = storeCache.get(curr)
      if (!store) {
        store = introspected(curr, (store, path) => {
          publish(key)
          // for (let [key, value] of changes) publish(key, value)
        })
        storeCache.set(curr, store)
      }

      switch(true) {
        // effect(target)
        case (!args.length):
          subscribe(key)
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
          let changed = false
          for (let name in obj) {
            let value = obj[name]
            if (equal(store[name], value)) continue
            store[name] = value
            changed = true
          }
          if (changed) publish(key)
          return store
      }
    }
  }

  return _[name]
}

import kebab from 'kebab-case'
import equal from 'fast-deep-equal'

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


export function createEffect(get) {
  let name = get.name
  let _ = {
    [name]: (target, ...args) => {
      let key = tuple(target, name)
      let curr = get(target)

      switch(true) {
        // effect(target)
        case (!args.length):
          subscribe(key)
          return curr

        // effect`...`
        // case (args[0].raw):
        //   return template.call(target, target, ...args)
        //

        // effect(target, s => {...})
        case (typeof args[0] === 'function'):
          let fn = args[0]
          let result = fn(curr)
          if (result !== curr && typeof result === typeof curr) {
            _[name](target, result)
          }
          return curr

        // effect(target, obj)
        case (typeof args[0] === 'object'):
          let obj = args[0]
          let changed = false
          for (let name in obj) {
            let value = obj[name]
            if (equal(curr[name], value)) continue
            curr[name] = value
            changed = true
          }
          if (changed) publish(key)
          return curr
      }
    }
  }

  return _[name]
}

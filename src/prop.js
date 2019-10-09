import { setMicrotask, clearMicrotask } from './util'

// async generator, returning props of an object
// TODO: all-sets mode (no diff check)

const cache = new WeakMap

export default function prop(target, name) {
  if (!name) throw Error('`prop` expects property name to observe')

  // check if prop is configurable
  let desc = Object.getOwnPropertyDescriptor(target, name)
  if (cache.has(desc)) return cache.get(desc)

  let currentValue, plannedValue, planned
  let resolve, p = new Promise(ok => resolve = ok)

  if (desc) {
    // previously registered descriptor

    // new descriptor
    if (!desc.configurable) throw Error('`x` is not configurable property')
    currentValue = desc.value

    // FIXME: redefine descriptor

    TODO
  }
  else {
    currentValue = target.x
    desc = {
      get() {
        // shortcut planned call
        if (planned) applyValue()
        return value
      },
      set(value) {
        if (Object.is(value, currentValue)) {
          if (planned) clearMicrotask(planned)
          return
        }

        if (!planned) planned = setMicrotask(applyValue)
        plannedValue = value
      }
    }
  }

  function applyValue() {
    planned = null
    resolve(plannedValue)
    p = new Promise(ok => resolve = ok)
    fn.then = p.then.bind(p)
  }

  async function* fn () {
    while (true) {
      yield p
    }
  }
  fn.then = p.then.bind(p)

  Object.defineProperty(target, name, desc)
  cache.set(desc, fn)

  return fn
}

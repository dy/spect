import { setMicrotask, clearMicrotask } from './util'

// TODO: all-sets mode (no diff check)
// TODO: make all-events mode (no changes skipped)

const cache = new WeakMap

export default function prop(target, name, callback) {
  if (!name) throw Error('`prop` expects property name to observe')

  // check if prop is configurable
  let initialDesc = Object.getOwnPropertyDescriptor(target, name)
  if (cache.has(initialDesc)) return cache.get(initialDesc)

  let value = initialDesc && ('value' in initialDesc) ? initialDesc.value : target[name],
    plannedValue, planned
  let resolve, p = new Promise(ok => resolve = ok)

  let desc = {
    configurable: true,
    get() {
      // shortcut planned call
      if (planned) applyValue()

      // hook array: update on mutations
      if (Array.isArray(value) && !(value instanceof ArrayProp)) {
        return new ArrayProp(value, () => {
          if (!planned) planned = setMicrotask(applyValue)
          plannedValue = value
        })
      }

      return value
    },
    set(newValue) {
      if (Object.is(newValue, value)) {
        if (planned) clearMicrotask(planned)
        return
      }

      if (!planned) planned = setMicrotask(applyValue)
      plannedValue = newValue
    }
  }

  function applyValue(val) {
    planned = null
    value = arguments.length ? val : plannedValue
    callback && callback(value)
    resolve({ value })
    p = new Promise(ok => resolve = ok)
    handle.then = p.then.bind(p)
  }

  let handle = {
    end () {
      handle.done = true

      Object.defineProperty(target, name, initialDesc || {
        configurable: true,
        value,
        writable: true,
        enumerable: true
      })
      if (initialDesc) target[name] = value
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (handle.done) return {done: true}
          this.i++
          return p
        },
        // FIXME: find out good pattern with ending generator
        return() {
          handle.done = true
          handle.end()
        }
      }
    },
    done: false,
    then: p.then.bind(p)
  }

  Object.defineProperty(target, name, desc)
  cache.set(desc, handle)

  Promise.resolve().then(() => applyValue(value))

  return handle
}

let _change = Symbol('change')
let _value = Symbol('value')
class ArrayProp extends Array {
  constructor (value, callback) {
    super(...value)
    this[_value] = value
    this[_change] = callback
  }
  push(...args) {
    super.push(...args)
    this[_value].push(...args)
    this[_change]()
  }
}

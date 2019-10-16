import { setMicrotask, clearMicrotask, isElement } from './util'
import { on, emit, off } from 'emmy'
import tuple from 'immutable-tuple'

// TODO: all-sets mode (no diff check)
// TODO: make all-events mode (no changes skipped)

const cache = new WeakMap

export default function prop(target, name, callback) {
  if (!name) throw Error('`prop` expects property name to observe')

  if (callback) on(target, 'prop:change', isElement(target) ? (e) => {
    callback(e.detail)
  } : callback)

  if (cache.has(tuple(target, name))) {
    return cache.get(tuple(target, name))
  }

  // check if prop is configurable
  let initialDesc = Object.getOwnPropertyDescriptor(target, name)

  let value = initialDesc && ('value' in initialDesc) ? initialDesc.value : target[name],
    plannedValue, planned
  let resolve, p = new Promise(ok => resolve = ok)

  let desc = {
    configurable: true,
    get() {
      // shortcut planned call
      if (planned) applyValue()
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
    emit(target, 'prop:change', value)
    resolve({ value })
    p = new Promise(ok => resolve = ok)
    stream.then = p.then.bind(p)
  }

  let stream = {
    cancel() {
      stream.done = true

      Object.defineProperty(target, name, initialDesc || {
        configurable: true,
        value,
        writable: true,
        enumerable: true
      })
      if (initialDesc) target[name] = value

      off(target, '.prop')
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (stream.done) return {done: true}
          this.i++
          return p
        },
        // FIXME: find out good pattern with closeing generator
        return() {
          stream.done = true
          stream.cancel()
        }
      }
    },
    done: false,
    then: p.then.bind(p)
  }

  Object.defineProperty(target, name, desc)
  cache.set(tuple(target, name), stream)

  Promise.resolve().then(() => {
    applyValue(value)

    // inputs mustn't have defined property for the time of input
    if ('onchange' in target) {
      let desc = Object.getOwnPropertyDescriptor(target, name)
      on(target, 'focus.prop', e => {
        delete target[name]
      })
      on(target, 'blur.prop', e => {
        Object.defineProperty(target, name, desc)
      })
      on(target, 'change.prop input.prop', e => {
        applyValue(target[name])
      })
    }
  })

  return stream
}

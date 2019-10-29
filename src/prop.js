import { setMicrotask, clearMicrotask, isElement, ReadableStream } from './util'
import { on, emit, off } from 'emmy'
import tuple from 'immutable-tuple'

// TODO: all-sets mode (no diff check)
// TODO: make all-events mode (no changes skipped)

const cache = new WeakMap

export default function prop(target, name, callback) {
  if (!name) throw Error('`prop` expects property name to observe')

  let key = tuple(target, name)
  let currentValue, plannedValue, planned
  let cached = cache.get(key)

  // init observer if the first time
  if (!cached) {
    // check if prop is configurable
    let initialDesc = Object.getOwnPropertyDescriptor(target, name)

    currentValue = initialDesc && ('value' in initialDesc) ? initialDesc.value : target[name]

    let desc = {
      configurable: true,
      get() {
        // shortcut planned call
        if (planned) {
          clearMicrotask(planned)
          applyValue()
        }
        return initialDesc && initialDesc.get ? initialDesc.get.call(target) : currentValue
      },
      set(newValue) {
        if (Object.is(newValue, currentValue)) {
          if (planned) clearMicrotask(planned)
          return
        }

        if (!planned) planned = setMicrotask(applyValue)
        plannedValue = newValue
      }
    }

    function applyValue(val) {
      planned = null

      cached.value = currentValue = arguments.length ? val : plannedValue
      if (initialDesc && initialDesc.set) initialDesc.set.call(target, currentValue)

      emit(target, 'prop:change:' + name, currentValue)
    }

    Object.defineProperty(target, name, desc)


    // inputs mustn't have defined property for the time of input
    if (name === 'value') {
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
    }

    cache.set(key, cached = { initialDesc, count: 0, value: currentValue })
  }
  else {
    currentValue = cached.value
  }

  let off
  return new ReadableStream({
    start(controller) {
      cached.count++

      off = on(target, 'prop:change:' + name, (e) => {
        if (isElement(target)) {
          controller.enqueue(e.detail)
          callback && callback(e.detail)
        }
        else {
          controller.enqueue(e)
          callback && callback(e)
        }
      })

      // initial value
      callback && callback(currentValue)
      controller.enqueue(currentValue)
    },
    pull(controller) {
    },
    cancel(reason) {
      this.done = true

      cached.count--

      // undefine descriptor
      if (cached.count === 0) {
        let initialDesc = cached.initialDesc
        if (initialDesc) {
          if (initialDesc.value) {
            initialDesc.value = currentValue
          }
          Object.defineProperty(target, name, initialDesc)
        }
        else {
          delete target[name]
          target[name] = currentValue
        }
        off(target, '.prop')
      }

      off()
      cache.delete(key)
    }
  })
}

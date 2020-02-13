import Cancelable from './cancelable.js'

// observable value with notification on every set
export const _n = Symbol.for('__spect.notify')
export const _p = Symbol.for('__spect.promise')

export default function ref(value) {
  let resolve, changed
  function ref(value) {
    if (arguments.length) ref.set(value)
    return ref.get()
  }
  Object.assign(ref, {
    [_p]: new Cancelable(r => resolve = r),

    current: value,

    get() { return ref.current },

    set(value) {
      ref.current = value
      ref[_n]()
    },

    [_n]() {
      if (changed) return
      // need 2 ticks delay or else subscribed iterators possibly miss latest changed value
      changed = Promise.resolve().then().then(() => {
        changed = null
        resolve()
        ref[_p] = new Cancelable(r => resolve = r)
      })
    },
    async *[Symbol.asyncIterator]() {
      yield ref.get()
      try {
        while (1) {
          await ref[_p]
          yield ref.get()
        }
      } catch (e) {
      } finally {
      }
    },

    // let [value, setValue] = ref
    // *[Symbol.iterator]() {
    //   yield ref.get()
    //   yield ref.set
    // },

    // Promise
    cancel() {
      return ref[_p].cancel()
    },
    then(...args) {
      return ref[_p].then(...args)
    }

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })
  ref.valueOf = ref.toString = ref[Symbol.toPrimitive] = ref.get

  // value[0]
  // Object.defineProperties(ref, { [0]: { enumerable: false, get: ref.get }, [1]: { enumerable: false, get: () => ref.set } })

  return ref
}

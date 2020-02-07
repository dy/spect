import Cancelable from './cancelable.js'

// observable value with notification on every set
export const _notify = Symbol.for('__spect.notify')
export const _p = Symbol.for('__spect.p')

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
      ref[_notify]()
    },

    [_notify]() {
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
      } finally {

      }
    },

    cancel() {
      ref[_p].cancel()
    }

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })
  ref.valueOf = ref.toString = ref[Symbol.toPrimitive] = ref.get

  return ref
}

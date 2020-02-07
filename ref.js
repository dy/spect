// observable value with notification on every set

export const _get = Symbol.for('__spect.get')
export const _set = Symbol.for('__spect.set')
export const _notify = Symbol.for('__spect.notify')

export default function ref(value) {
  let resolve, p = new Promise(r => resolve = r), changed
  function ref(value) {
    if (arguments.length) ref[_set](value)
    return ref[_get]()
  }
  Object.assign(ref, {
    current: value,

    [_get]() { return ref.current },

    [_set](value) {
      ref.current = value
      ref[_notify]()
    },

    [_notify]() {
      if (changed) return
      // need 2 ticks delay or else subscribed iterators possibly miss latest changed value
      changed = Promise.resolve().then().then(() => {
        changed = null
        resolve()
        p = new Promise(r => resolve = r)
      })
    },
    async *[Symbol.asyncIterator]() {
      yield ref[_get]()
      while (1) {
        await p
        yield ref[_get]()
      }
    },

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })
  ref.valueOf = ref.toString = ref[Symbol.toPrimitive] = ref[_get]

  return ref
}

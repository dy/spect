// [ex]ref + channel = bus
import Cancelable from './cancelable.js'

// `get: () => value` - called to obtain current state `channel()`, called automatically on subscription.
// if omitted - the channel is considered stateless.
// `set: (value, prev) => notify:bool` - called to set new state, resolves promise, pushes next to observers (unless returned false).
export default function bus(get, set, teardown) {
  let resolve, changed, promise = new Cancelable(r => resolve = r)

  let channel = function (value) {
    if (arguments.length) {
      if (!set) throw Error('Setting unsettable')
      if (promise.isCanceled) throw Error('Setting canceled')
      let notify = get ? set(value) : set(value, get())

      if (notify) {
        if (changed) return
        // need 2 ticks delay or else subscribed iterators possibly miss latest changed value
        changed = Promise.resolve().then().then(() => {
          changed = null
          resolve(get ? get() : value)
          promise = new Cancelable(r => resolve = r)
        })
      }

      return get ? get() : value
    }

    if (!get) throw Error('Getting ungettable')
    return get()
  }

  Object.assign(channel, {
    async *[Symbol.asyncIterator]() {
      if (get) yield get()
      try {
        while (1) {
          // FIXME: update current promise with every new subscriber
          // yield await channel
          yield await promise
        }
      } catch (e) {
      } finally {
      }
    },

    // let [value, setValue] = ref
    *[Symbol.iterator]() {
      if (get) yield get()
    },

    // Promise
    cancel() {
      if (teardown) teardown()
      channel.isCanceled = true
      return promise.cancel()
    },
    then(...args) {
      return promise.then(...args)
    },
    map(fn) {
      // return calc(v = mapper(fn), [fn])
      let curr
      let ch2 = bus(null, value => curr = value)
      channel.subscribe(bus)
      return ch2
    },

    valueOf: get,
    toString: get,
    [Symbol.toPrimitive]: get,

    // Observable
    subscribe(fn) {
      if (get) fn(get())
      promise.then(function emit(value) {
        fn(value)
        promise.then(emit)
      })
    }
  })

  // value[0]
  if (get) Object.defineProperties(channel, { [0]: { enumerable: false, get } })

  return channel
}

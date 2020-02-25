// [ex]ref + channel = bus
import Cancelable from './cancelable.js'

// `get: () => value` is called to obtain current state, like `channel()`. It is called automatically on subscription.
// If null - the channel is considered stateless and don't emit initial event.
// `set: (value, prev) => changed?` - called to set/emit new state: resolves promise, pushes new value (unless returned false).
// If null - the channel can just push stateless notifications.
export default function bus(get, set, teardown) {
  let resolve, changed, promise = new Cancelable(r => resolve = r)

  const channel = function (value) {
    if (arguments.length) {
      if (promise.isCanceled) throw Error('Channel is canceled')
      let notify = set ? set(value) : null

      if (notify !== false) {
        if (changed) return
        // need 2 ticks delay or else subscribed iterators possibly miss latest changed value
        changed = Promise.resolve().then().then(() => {
          changed = null
          // no need to check get() here - it's checked in asyncIterator
          // (there's a tick between resolve here and getting control back in asyncIterator)
          resolve(value)
          promise = new Cancelable(r => resolve = r)
        })
      }

      return notify
    }

    if (!get) throw Error('Getting ungettable')
    return get()
  }

  Object.assign(channel, {
    async *[Symbol.asyncIterator]() {
      if (get) yield get()
      try {
        while (1) {
          if (get) {
            await promise
            yield get()
          }
          else {
            yield await promise
          }
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
      let curr
      let mapped = bus(() => curr, value => curr = value)
      channel.subscribe(bus)
      return mapped
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

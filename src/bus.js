// [ex]ref + channel = bus
import Cancelable from './cancelable.js'

// `get: () => value` is called to obtain current state, like `channel()`. It is called automatically on subscription.
// If null - the channel is considered stateless and does't emit initial event.
// If not null - bus is considered stateful
// `set: (value, prev) => changed?` - called to set/emit new state: resolves promise, pushes new value (unless returned false).
// If null - the channel can be just external-driven [stateful] notifications, like `input` observable.
export default function bus(get, set, teardown) {
  let resolve, changed, promise = new Cancelable(r => resolve = r), lastValue

  if (get) {
    const _get = get
    get = () => {
      // get instantly applies planned value
      if (changed && 'value' in changed) {
        lastValue = changed.value
        delete changed.value
        if (set) set(lastValue)
      }

      return _get()
    }
  }

  const channel = function (value) {
    if (arguments.length) {
      if (promise.isCanceled) throw Error('Channel is canceled')

      if (changed) {
        if (value !== lastValue) changed.value = value
        else delete changed.value
        return
      }

      // main set
      lastValue = value
      let notify = set ? set(value) : null

      if (notify !== false) {
        // throttle multiple changes within single tick
        // FIXME: is that an issue for channel, that's supposed to send every event?
        // need 2 ticks delay or else subscribed iterators possibly miss latest changed value
        changed = Promise.resolve().then().then(() => {
          // throttle multiple set calls between ticks
          if ('value' in changed) {
            lastValue = changed.value
            if (set) set(lastValue)
          }

          changed = null

          // no need to get() here - it's checked in asyncIterator
          // (there's a tick between resolve here and getting control back in asyncIterator)
          resolve(lastValue)
          promise = new Cancelable(r => resolve = r)
        })
      }

      return notify
    }

    return get && get()
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
            let res = await promise
            yield res
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
    then(y, n) {
      return promise.then(value => y(get ? get() : value), n)
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

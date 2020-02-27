// ref + channel = bus
import Cancelable from './cancelable.js'
import _observable from 'symbol-observable'

export const _bus = Symbol.for('@@spect.bus')

// `get: () => value` is called to obtain current state, like `channel()`. It is called automatically on subscription.
// The main purpose - provide getter for user.
// If null - the channel is considered stateless, does't emit initial event and returns always null.
//
// `set: (value, prev) => changed?` - intended to set value by user.
// Emit new state: resolves promise, pushes new value (unless returned false).
// If null - the channel can be just external-driven [stateful] notifications, like `input`, `on`, `from` etc.
export default function bus(get, set, teardown) {
  let resolve, promise = new Cancelable(r => resolve = r), subs = [], ibufs = []

  const channel = function (value) {
    if (arguments.length) {
      if (promise.canceled) throw Error('Channel is canceled')

      let notify = set ? set(value) : null

      if (notify !== false) {
        resolve(value = get ? get() : value)
        subs.map(sub => sub(value))
        ibufs.map(buf => buf[0] = value)
        promise = new Cancelable(r => resolve = r)
      }

      return notify
    }

    return get && get()
  }

  Object.assign(channel, {
    [_bus]() { return channel },

    async *[Symbol.asyncIterator]() {
      if (get) yield get()
      let buf = []
      ibufs.push(buf)
      try {
        while (1) {
          await promise
          // from the moment promise was resolved until now, other values could've been set to bus, that's for we need buf
          while (buf.length) {
            yield buf.pop()
            // from the moment yield got control back, the stack could've been topped up again
          }
        }
      } catch (e) {
      } finally {
      }
    },

    [_observable]() {
      return {
        subscribe(next) {
          if (next.next) next = next.next
          subs.push(next)
          return {
            unsubscribe() {
              subs.splice(subs.indexOf(next) >>> 0, 1)
            }
          }
        },
        [_observable](){ return this }
      }
    },

    // Promise
    cancel() {
      subs.length = 0
      if (teardown) teardown()
      channel.canceled = true
      return promise.cancel()
    },
    then(y, n) {
      return promise.then(y, n)
    },
    map(fn) {
      let curr
      let mapped = bus(() => curr, null)
      channel[_observable]().subscribe(bus)
      return mapped
    }
  })

  // value[0]
  if (get) {
    channel.valueOf = channel.toString = channel[Symbol.toPrimitive] = get
    Object.defineProperties(channel, { [0]: { enumerable: false, get } })
    channel[Symbol.iterator] = function*() { if (get) yield get() }
  }

  return channel
}

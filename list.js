import bus, { _bus } from './src/bus.js'
import _observable from 'symbol-observable'

export default function list(arr = []) {
  const channel = bus(() => arr)

  const observable = {
    [_bus]: () => channel,
    [_observable]: channel[_observable],
    [Symbol.asyncIterator]: channel[Symbol.asyncIterator]
  }

  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (observable[prop]) return observable[prop]
      return arr[prop]
    },
    has(arr, prop) {
      if (observable[prop]) return true
      return prop in arr
    },
    set(arr, prop, value) {
      if (Object.is(arr[prop], value)) return true
      arr[prop] = value
      channel(arr)
      return true
    },
    deleteProperty(arr, prop) {
      if (prop in arr) {
        delete arr[prop]
        channel(arr)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

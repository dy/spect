import bus, { _bus } from './src/bus.js'
import _observable from 'symbol-observable'

export default function store(obj = {}) {
  const channel = bus(() => obj)

  const observable = {
    [_bus]: () => channel,
    [_observable]: channel[_observable],
    [Symbol.asyncIterator]: channel[Symbol.asyncIterator]
  }

  const proxy = new Proxy(obj, {
    get(obj, prop) {
      if (observable[prop]) return observable[prop]
      return obj[prop]
    },
    has(obj, prop) {
      if (observable[prop]) return true
      return prop in obj
    },
    set(obj, prop, value) {
      if (Object.is(obj[prop], value)) return true
      obj[prop] = value
      channel(obj)
      return true
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        delete obj[prop]
        channel(obj)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

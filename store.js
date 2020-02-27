import bus, { _bus } from './src/bus.js'
import _observable from 'symbol-observable'

export default function store(obj = {}) {
  const channel = bus(() => obj)

  obj[_bus] = () => channel
  obj[_observable] = channel[_observable]
  obj[Symbol.asyncIterator] = channel[Symbol.asyncIterator]

  const proxy = new Proxy(obj, {
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

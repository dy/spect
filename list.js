import bus, { _bus } from './src/bus.js'
import _observable from 'symbol-observable'

export default function list(arr = []) {
  const channel = bus(() => arr)

  arr[_bus] = () => channel
  arr[_observable] = channel[_observable]
  arr[Symbol.asyncIterator] = channel[Symbol.asyncIterator]

  const proxy = new Proxy(arr, {
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

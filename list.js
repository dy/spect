import createRef from './src/bus.js'
// import { _current } from './src/util.js'

export default function list(arr = []) {
  const ref = createRef(arr)

  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (prop === _current) return ref[_current]
      if (prop === Symbol.asyncIterator) return ref[Symbol.asyncIterator]
      return arr[prop]
    },
    has(arr, prop) {
      if (prop === _current) return true
      if (prop === Symbol.asyncIterator) return true
      return prop in arr
    },
    set(arr, prop, value) {
      if (Object.is(arr[prop], value)) return true
      arr[prop] = value
      ref(arr)
      return true
    },
    deleteProperty(arr, prop) {
      if (prop in arr) {
        delete arr[prop]
        ref(arr)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

import bus from './src/bus.js'

export default function list(arr = []) {
  const channel = bus()

  // arr[Symbol.asyncIterator] = channel[Symbol.asyncIterator]

  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (prop === Symbol.asyncIterator) return channel[Symbol.asyncIterator]
      return arr[prop]
    },
    has(arr, prop) {
      if (prop === Symbol.asyncIterator) return true
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

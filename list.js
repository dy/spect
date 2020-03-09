// deprecated
import value from './value.js'
import _observable from 'symbol-observable'

export default function list(arr = []) {
  const cur = value(arr)
  const observable = () => ({ subscribe:cur})
  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (prop === _observable) return observable
      return arr[prop]
    },
    has(arr, prop) {
      if (prop === _observable) return true
      return prop in arr
    },
    set(arr, prop, value) {
      if (Object.is(arr[prop], value)) return true
      arr[prop] = value
      cur(arr)
      return true
    },
    deleteProperty(arr, prop) {
      if (prop in arr) {
        delete arr[prop]
        cur(arr)
        return true
      }
      else {
        return false
      }
    }
  })


  return proxy
}

import _observable from 'symbol-observable'
import value from './value.js'

export default function store(obj = {}) {
  const cur = value(obj)

  const observable = () => cur

  const proxy = new Proxy(obj, {
    get(obj, prop) {
      if (prop === _observable) return observable
      return obj[prop]
    },
    has(obj, prop) {
      if (prop === _observable) return true
      return prop in obj
    },
    set(obj, prop, value) {
      if (Object.is(obj[prop], value)) return true
      obj[prop] = value
      cur(obj)
      return true
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        delete obj[prop]
        cur(obj)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

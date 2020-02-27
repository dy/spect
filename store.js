// import createRef, { _current } from './src/ref.js'

export default function store(obj = {}) {
  const ref = createRef(obj)

  const proxy = new Proxy(
    Object.assign(Object.create({
      [Symbol.asyncIterator]: ref[Symbol.asyncIterator],
      [_current]: ref[_current]
    }), obj), {
    set(obj, prop, value) {
      if (Object.is(obj[prop], value)) return true
      obj[prop] = value
      ref(obj)
      return true
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        delete obj[prop]
        ref(obj)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

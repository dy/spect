import createRef from './src/ref.js'

export default function store(obj = {}) {
  const ref = createRef(obj)

  const proxy = new Proxy(
    Object.assign(Object.create({
      [Symbol.asyncIterator]: ref[Symbol.asyncIterator],
      [Symbol.toPrimitive]: ref[Symbol.toPrimitive]
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

import createRef from './ref.js'

export default function store(obj = {}) {
  const ref = createRef(obj)

  const proxy = new Proxy(
    Object.assign(Object.create({
      [Symbol.asyncIterator]: ref[Symbol.asyncIterator],
      valueOf: ref.get
    }), obj), {
    set(obj, prop, value) {
      obj[prop] = value
      ref({...obj})
      return true
    },
    deleteProperty(obj, prop) {
      if (prop in obj) {
        delete obj[prop]
        ref({...obj})
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

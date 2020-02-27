import bus from './src/bus.js'

export default function store(obj = {}) {
  const channel = bus(() => obj)

  const proxy = new Proxy(
    obj = Object.assign(Object.create({
      [Symbol.asyncIterator]: channel[Symbol.asyncIterator]
    }), obj), {
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

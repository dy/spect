import createRef from './ref.js'

export default function store(obj = {}) {
  const ref = createRef(obj)
  // obj = Object.assign(Object.create(ref), obj)
  // ref(obj)
  obj[Symbol.asyncIterator] = ref[Symbol.asyncIterator]

  const proxy = new Proxy(obj, {
    set(obj, prop, value) {
      obj[prop] = value
      ref(obj)
      return true
    }
  })

  return proxy
}

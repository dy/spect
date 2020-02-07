import createRef from './ref.js'

export default function store(obj = {}) {
  const ref = createRef(obj)
  // obj = Object.assign(Object.create(ref), obj)
  // ref(obj)

  const proxy = new Proxy(ref, {
    set(obj, prop, value) {
      obj[prop] = value
      ref(obj)
      return true
    },
  })

  return proxy
}

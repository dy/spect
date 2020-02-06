import createRef from './ref.js'

const _fxValue = Symbol.for('spectFx')

export default function store(obj = {}) {
  const ref = createRef(obj)
  // obj = Object.assign(Object.create(ref), obj)
  // ref(obj)

  const proxy = new Proxy(ref, {
    get(obj, prop) {
      if (prop === _fxValue) {
        return ref.current
      }
      if (prop === Symbol.asyncIterator) {
        return ref[Symbol.asyncIterator]
      }
      return obj[prop]
    },
    set(obj, prop, value) {
      obj[prop] = value
      ref(obj)
      return true
    },
  })

  return proxy
}

import createRef from './ref.js'

// not needed since array internally accesses index
// const mutators = {
//   push: true,
//   copyWithin: true,
//   fill: true,
//   pop: true,
//   push: true,
//   reverse: true,
//   shift: true,
//   unshift: true,
//   sort: true,
//   splice: true,
//   flat: true
// }

// const subs = new WeakMap

export default function list(arr = []) {
  const ref = createRef(arr)

  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (prop === Symbol.asyncIterator) return ref[Symbol.asyncIterator]
      return arr[prop]
    },
    has(arr, prop) {
      if (prop === Symbol.asyncIterator) return true
      return prop in arr
    },
    set(arr, prop, value) {
      if (Object.is(arr[prop], value)) return true
      arr[prop] = value
      ref(arr)

      // subscribe to updates?
      // if (changeable(value) && !subs.has(value)) subs.add(fx(value => ref(arr), [value]))

      return true
    },
    deleteProperty(arr, prop) {
      if (prop in arr) {
        delete arr[prop]
        ref(arr)
        return true
      }
      else {
        return false
      }
    }
  })

  return proxy
}

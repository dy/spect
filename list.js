import createRef from './src/ref.js'

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

  // for (let m in mutators) {
  //   let orig = arr[m].bind(arr)
  //   arr[m] = (...args) => (orig(...args), ref(arr))
  // }

  const proxy = new Proxy(arr, {
    get(arr, prop) {
      if (prop === Symbol.toPrimitive) return ref[Symbol.toPrimitive]
      if (prop === Symbol.asyncIterator) return ref[Symbol.asyncIterator]
      return arr[prop]
    },
    has(arr, prop) {
      if (prop === Symbol.toPrimitive) return true
      if (prop === Symbol.asyncIterator) return true
      return prop in arr
    },
    set(arr, prop, value) {
      if (Object.is(arr[prop], value)) return true
      arr[prop] = value
      ref(arr)
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

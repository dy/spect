// modern version of observable/value
export default function state (value) {
  let resolve, p = new Promise(r => resolve = r), changed
  const set = (value) => {
    let newValue = typeof value === 'function' ? value(ref.current) : value
    if (newValue === ref.current) return
    ref.current = newValue
    notify()
  }
  const notify = () => {
    if (changed) return
    changed = Promise.resolve().then(() => {
      changed = null
      resolve(ref.current)
      p = new Promise(r => resolve = r)
    })
  }
  function ref(value) {
    return arguments.length ? set(value) : ref.current
  }
  ref.valueOf = ref.toString = ref[Symbol.toPrimitive] = () => ref.current

  Object.assign(ref, {
    async *[Symbol.asyncIterator]() {
      yield ref.current
      while (1) yield await p
    },

    // [value, setValue] = state()
    *[Symbol.iterator]() {
      yield ref.current
      yield set
    }
  })
  set(value)

  return ref
}

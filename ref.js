// observable value with notification on every set
export default function ref(value) {
  let resolve, p = new Promise(r => resolve = r), changed
  const notify = () => {
    if (changed) return
    // needs 2 ticks delay or else subscribed iterators possibly miss latest changed value
    changed = Promise.resolve().then().then(() => {
      changed = null
      resolve(ref.get())
      p = new Promise(r => resolve = r)
    })
  }
  function ref(value) {
    return arguments.length ? ref.set(value) : ref.get()
  }
  Object.assign(ref, {
    get() { return ref.current },

    set(value) {
      ref.current = value
      notify()
      return ref.get()
    },

    async *[Symbol.asyncIterator]() {
      yield ref.get()
      while (1) {
        await p
        yield ref.get()
      }
    },

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })
  ref.valueOf = ref.toString = ref[Symbol.toPrimitive] = ref.get
  ref.set(value)

  return ref
}

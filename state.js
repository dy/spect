export default function state (value) {
  let current = typeof value === 'function' ? value() : value
  const get = () => current
  const set = (value) => {
    if (value === current) return
    current = typeof value === 'function' ? value(current) : value
    plan()
  }
  function ref(value) {
    if (arguments.length) set(value)
    return current
  }

  Object.defineProperties(ref, { current: { get, set } })

  Object.assign(ref, {
    // +value
    valueOf: get,
    toString: get,
    [Symbol.toPrimitive]: get,

    async *[Symbol.asyncIterator]() {
      yield current
      while (true) {
        let v = await p
        yield current
      }
    },

    // [value, setValue] = state()
    *[Symbol.iterator](){
      yield current
      yield set
    }
  })

  let planned = false, resolve, p = new Promise(r => resolve = r)
  const plan = () => {
    if (planned) return
    planned = true
    // to compensate the initial subscription tick (first `yield` must be the state at the moment of subscription)
    // 2 ticks must be introduced for notification
    Promise.resolve().then().then(() => {
      planned = false
      resolve(current)
      p = new Promise(r => resolve = r)
    })
  }

  return ref
}

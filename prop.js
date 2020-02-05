const cache = new WeakMap()

export default async function prop(target, name) {
  let propRefs = cache.get(target)
  if (!propRefs) cache.set(target, propRefs = {})
  let ref = propRefs[name]

  if (!ref) {
    const initialDesc = Object.getOwnPropertyDescriptor(target, name)
    let resolve, p = new Promise(r => resolve = r)

    propRefs[name] = ref = {
      [Symbol.asyncIterator]: async function* () {
        while (!ref.closed) {
          yield target[name]
          await p
        }
      },
      close() {
        this.closed = true
        if (initialDesc) Object.defineProperty(target, name, initialDesc)
        else Object.defineProperty(target, name, { configurable: true, value: ref.current })
      },
      closed: false,
      current: initialDesc ? (('value' in initialDesc) ? initialDesc.value : null) : target[name]
    }

    Object.defineProperty(target, name, {
      configurable: true,
      get() {
        return initialDesc && initialDesc.get ? initialDesc.get.call(target) : ref.current
      },
      set(value) {
        if (initialDesc && initialDesc.set) initialDesc.set.call(target, value)
        else ref.current = value
        resolve()
        p = new Promise(r => resolve = r)
      }
    })
  }

  return ref
}

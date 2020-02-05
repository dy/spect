const cache = new WeakMap()

export function prop(target, name) {
  let observableProps = cache.get(target)
  if (!observableProps) cache.set(target, observableProps = {})
  let observable = observableProps[name]

  if (!observable) {
    const initialDesc = Object.getOwnPropertyDescriptor(target, name)

    observableProps[name] = observable = () => {
      callbacks = null

      // undefine property
      if (initialDesc) Object.defineProperty(target, name, initialDesc)
      else Object.defineProperty(target, name, { configurable: true, value: current })
    }

    let callbacks = []
    let current = initialDesc ? (('value' in initialDesc) ? initialDesc.value : null) : target[name]
    observable.subscribe = (cb) => observable.callbacks.push(cb)

    Object.defineProperty(target, name, {
      configurable: true,
      get() {
        return initialDesc && initialDesc.get ? initialDesc.get.call(target) : current
      },
      set(value) {
        if (initialDesc && initialDesc.set) initialDesc.set.call(target, value)
        else current = value
        callbacks.map(cb => cb(value))
      }
    })
  }

  return observable
}

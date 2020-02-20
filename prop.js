import ref from './src/ref.js'

const cache = new WeakMap

export default function prop(target, name) {
  let refs = cache.get(target)
  if (!refs) cache.set(target, refs = {})
  if (refs[name]) return refs[name]

  const desc = Object.getOwnPropertyDescriptor(target, name)
  const prop = refs[name] = ref(
    desc ? (
      ('value' in desc) ?
        desc.value :
        // desc.get.call(target)
        // no need to call initial getter - ref.get() anyways calls it
        undefined
    ) :
    target[name]
  )

  const set = prop.set
  Object.defineProperty(target, name, {
    configurable: true,
    get() {
      return desc && desc.get ? desc.get.call(target) : prop.current
    },
    set(value) {
      // FIXME: notifying only changed values
      set(value)
      if (desc && desc.set) desc.set.call(target, value)
    }
  })

  // rewire ref get/set to target prop
  prop.get = () => target[name]
  prop.set = value => {
    target[name] = value
  }

  const cancel = prop.cancel
  prop.cancel = (reason) => {
    cancel(reason)
    if (desc) Object.defineProperty(target, name, desc)
    else Object.defineProperty(target, name, { configurable: true, value: prop.get() })
  }

  return prop
}

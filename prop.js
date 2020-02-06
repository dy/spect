import ref from './ref.js'

export default function prop(target, name) {
  // let propRefs = cache.get(target)
  // if (!propRefs) cache.set(target, propRefs = {})

  const desc = Object.getOwnPropertyDescriptor(target, name)
  const prop = ref(
    desc ? (
      ('value' in desc) ?
        desc.value :
        // desc.get.call(target)
        // no need to call initial getter - the target is rewired on get anyways
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
      set(value)
      if (desc && desc.set) desc.set.call(target, value)
    }
  })

  // rewire ref get/set to target prop
  prop.get = () => target[name]
  prop.set = value => {
    if (typeof value === 'function') value = value(target[name])
    target[name] = value
  }

  let closed = false
  prop.close = () => {
    closed = true
    if (desc) Object.defineProperty(target, name, desc)
    else Object.defineProperty(target, name, { configurable: true, value: prop.get() })
  }

  return prop
}

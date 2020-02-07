import ref, { _get, _set } from './ref.js'

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

  const set = prop[_set]
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
  prop[_get] = () => target[name]
  prop[_set] = value => {
    if (typeof value === 'function') value = value(target[name])
    target[name] = value
  }

  let closed = false
  prop.cancel = () => {
    closed = true
    if (desc) Object.defineProperty(target, name, desc)
    else Object.defineProperty(target, name, { configurable: true, value: prop[_get]() })
  }

  return prop
}

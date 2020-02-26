import bus from './src/bus.js'

const cache = new WeakMap

export default function prop(target, name) {
  let refs = cache.get(target)
  if (!refs) cache.set(target, refs = {})
  if (refs[name]) return refs[name]

  let current
  const desc = Object.getOwnPropertyDescriptor(target, name)
  const prop = refs[name] = bus(
    desc ? (desc.get ? desc.get.bind(target): () => desc.value) : (current = target[name], () => current),
    desc ? (desc.set ? desc.set.bind(target) : value => desc.value = value) : value => current = value,
    () => Object.defineProperty(target, name, desc || { configurable: true, value: prop() })
  )

  Object.defineProperty(target, name, {
    configurable: true,
    get() {
      return prop()
    },
    set(value) {
      return prop(value)
    }
  })

  return prop
}

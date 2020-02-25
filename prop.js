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
    // desc ? (
    //   ('value' in desc) ?
    //     desc.value :
    //     // desc.get.call(target)
    //     // no need to call initial getter - ref.get() anyways calls it
    //     undefined
    // ) :
    // target[name]
    () => Object.defineProperty(target, name, desc || { configurable: true, value: prop() })
  )

  // const set = prop.set
  Object.defineProperty(target, name, {
    configurable: true,
    get() {
      return prop()
      // return desc && desc.get ? desc.get.call(target) : desc.value
    },
    set(value) {
      return prop(value)
      // FIXME: notifying only changed values
      // set(value)
      // if (desc && desc.set) desc.set.call(target, value)
    }
  })

  // const cancel = prop.cancel
  // prop.cancel = (reason) => {
  //   cancel(reason)
  //   if (desc) Object.defineProperty(target, name, desc)
  //   else Object.defineProperty(target, name, { configurable: true, value: prop.get() })
  // }

  return prop
}

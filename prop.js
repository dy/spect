import value from './value.js'

const CANCEL = null

const cache = new WeakMap

export default function prop(target, name) {
  let refs = cache.get(target)
  if (!refs) cache.set(target, refs = {})
  if (refs[name]) return refs[name]

  const desc = Object.getOwnPropertyDescriptor(target, name)

  // prop is simply last-get value storage with subscriptions
  const prop = value(target[name])

  const get = desc ? (desc.get ? desc.get.bind(target): () => desc.value) : prop
  const set = desc ?
    (desc.set ?
      (value) => (desc.set.call(target, value), prop(get())) :
      (value) => (desc.value = value, prop(get()))
    ) : prop

  Object.defineProperty(target, name, { configurable: true, get, set })

  return refs[name] = (...args) =>
    !args.length ?
      get() :
    args[0] === CANCEL ?
      Object.defineProperty(target, name, desc || { configurable: true, value: get() }) :
    typeof args[0] === 'function' ?
      prop(...args) :
      set(...args)
}

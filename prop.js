import value from './value.js'

const cache = new WeakMap

export default function prop(target, name) {
  let refs = cache.get(target)
  if (!refs) cache.set(target, refs = {})
  if (refs[name]) return refs[name]

  const desc = Object.getOwnPropertyDescriptor(target, name)

  // prop is simply last-get value storage with subscriptions
  const prop = value(undefined), { next, cancel } = prop

  const get = prop.get = desc ? (desc.get ? desc.get.bind(target): () => desc.value) : prop.get
  const set = prop.set = desc ?
    (desc.set ?
      (value) => (desc.set.call(target, value), next(get())) :
      (value) => next(desc.value = value)
    ) : prop.set
  prop.cancel = () => (cancel(), Object.defineProperty(target, name, desc || { configurable: true, value: get() }))

  Object.defineProperty(target, name, { configurable: true, get, set })

  return refs[name] = prop
}


export function props (obj) {
  let props = []
  for (let name in obj) {
    props.push(prop(obj, name))
  }

  return calc((...props) => {

  }, props)
}


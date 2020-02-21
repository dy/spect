export function changeable(dep) {
  return dep && !primitive(dep) && (
    Symbol.asyncIterator in dep ||
    'next' in dep ||
    'then' in dep ||
    'subscribe' in dep ||
    observable(dep) ||
    stream(dep)
  )
}

export function stream(dep) {
  return dep && dep.pipe && dep.on
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(dep) {
  return typeof dep === 'function' && 'set' in dep && !('get' in dep)
}

// get current value of reference, changeable or alike
export function getval(v) {
  if (!v || primitive(v)) return v
  if ('current' in v) return v.current
  if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]()

  // stateless changeables have no state
  if (changeable(v)) return

  return v
}

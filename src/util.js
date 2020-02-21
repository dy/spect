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
export function getval(v, prev) {
  if (!v || primitive(v)) return v
  if ('current' in v) return v.current
  if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]()

  // stateless changeables have no state
  if (changeable(v)) return

  // curiously, functional dep value is unavoidable due to this
  // to detect dep as async generator, we must call the function
  // which as a side-effect calls the regular function
  if (typeof v === 'function') {
    const result = v(prev)
    if (changeable(result)) return
    v = result
  }

  return v
}

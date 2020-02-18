export function changeable(dep) {
  return dep && !primitive(dep) && (Symbol.asyncIterator in dep || 'next' in dep || 'then' in dep || 'subscribe' in dep || observable(dep))
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(dep) {
  return typeof dep === 'function' && 'set' in dep
}

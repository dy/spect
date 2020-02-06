export default function fx(cb, deps=[]) {
  let current = []
  deps.map((dep, i) => {
    if (primitive(dep)) return current[i] = dep
    if ('then' in dep || 'subscribe' in dep) return

    if ('current' in dep) current[i] = dep.current
    else current[i] = dep
  })

  // observe changes
  deps.map(async (dep, i) => {
    if (primitive(dep)) return

    // async iterator
    if (Symbol.asyncIterator in dep) {
      for await (let value of dep) {
        if (value === current[i]) continue
        current[i] = value
        notify()
      }
    }
    // promise
    else if ('then' in dep) {
      dep.then(value => {
        current[i] = value
        notify()
      })
    }
    // observable
    else if ('subscribe' in dep) {
      dep.subscribe(value => {
        if (value === current[i]) return
        current[i] = value
        notify()
      })
    }
  })

  let changed = false
  const notify = () => {
    if (changed) return
    changed = true
    Promise.resolve().then(() => {
      changed = false
      cb(current)
    })
  }
  notify()
}

function primitive(val) {
  if (typeof val === 'object') {
    return val === null
  }
  return typeof val !== 'function'
}
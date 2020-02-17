import channel from './channel.js'

export default fx

export function fx(callback, deps=[ Promise.resolve().then() ]) {
  let current = [], prev = []
  let changed = false, destroy

  const fxChannel = channel(callback)
  const notify = () => {
    if (changed) return
    changed = true
    Promise.resolve().then(() => {
      changed = false
      if (destroy && destroy.call) destroy(...prev)
      prev = [...current]
      destroy = fxChannel(...current)
    })
  }

  // observe changes
  deps.map(async (dep, i) => {
    // resolve primitive immediately
    if (!changeable(dep)) {
      current[i] = dep
      notify()
    }
    // async iterator
    else if (Symbol.asyncIterator in dep) {
      for await (let value of dep) {
        current[i] = value
        notify()
      }
    }
    // promise
    else if (dep.then) {
      dep.then(value => {
        current[i] = value
        notify()
      })
    }
    // Observable
    else if (dep.subscribe) {
      dep.subscribe(value => {
        current[i] = value
        notify()
      })
    }
    // observable / observ / mutant
    else if (typeof dep === 'function') {
      dep(value => {
        current[i] = value
        notify()
      })
    }
  })

  return fxChannel
}

export function changeable(dep) {
  return dep && !primitive(dep) && (Symbol.asyncIterator in dep || 'then' in dep || 'subscribe' in dep || typeof dep === 'function')
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function dfx(callback, deps) {
  let prev = []
  return fx((...values) => {
    if (values.every((value, i) => Object.is(value, prev[i]))) return
    prev = values
    callback(...values)
  }, deps)
}

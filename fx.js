import channel from './channel.js'
import { changeable, observable, stream, getval } from './util.js'

export default fx

export function fx(callback, deps=[Promise.resolve().then()], sync=false) {
  let current = [], prev = []
  let changePlanned = null, destroy
  const fndeps = []

  const fxChannel = channel(callback)
  const notify = () => {
    if (changePlanned) return changePlanned

    // read all fn deps values
    fndeps.map((fn, i) => fn && (current[i] = fn()))

    // extra tick to skip sync deps
    return changePlanned = Promise.resolve().then().then(() => {
      changePlanned = null
      if (destroy && destroy.call) destroy(...prev)
      prev = current
      destroy = fxChannel(...current)
    })
  }

  // instant run
  if (sync) {
    current = deps.map(getval)
    destroy = fxChannel(...current)
  }

  // observe changes
  deps.map(async (dep, i) => {
    const set = value => {
      current[i] = value
      return notify()
    }

    // constant value
    if (!changeable(dep)) {
      // generator or simple function
      if (typeof dep === 'function') {
        const gen = dep()
        if (gen.next) for await (let value of gen) set(value)
        else {
          await set(gen)
          fndeps[i] = dep
        }
      }
      else {
        set(dep)
      }
    }
    // async iterator
    else if (Symbol.asyncIterator in dep) {
      for await (let value of dep) {
        set(value)
      }
    }
    // promise
    else if (dep.then) {
      dep.then(set)
    }
    // Observable
    else if (dep.subscribe) {
      dep.subscribe(set)
    }
    // observable / observ / mutant
    else if (observable(dep)) {
      dep(set)
    }
    // node streams
    else if (stream(dep)) {
      dep.on('data', set)
    }
  })

  return fxChannel
}

// effect run only when state changes
// NOTE: not suitable for store, list - it is mutable but same ref
export function dfx(callback, deps, prev = []) {
  return fx((...values) => {
    if (values.every((value, i) => Object.is(value, prev[i]))) return
    prev = values
    callback(...values)
  }, deps)
}

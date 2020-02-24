import channel from './src/channel.js'
import { changeable, observable, stream, getval, primitive } from './src/util.js'

export default fx

export function fx(callback, deps=[Promise.resolve().then()], sync=false) {
  let current = deps.map(getval)
  let changePlanned = null, destroy

  const fxChannel = channel(callback)
  const notify = () => {
    if (changePlanned) return changePlanned

    // extra tick to skip sync deps
    return changePlanned = Promise.resolve().then().then(() => {
      changePlanned = null
      if (destroy && destroy.call) destroy()
      destroy = fxChannel(...current)
    })
  }

  // instant run
  if (sync) {
    destroy = fxChannel(...(sync = current))
    Promise.resolve().then().then().then(() => sync = false)
  }

  // observe changes
  deps.map(async (dep, i) => {
    const set = value => {
      if (sync && value === sync[i]) return
      current[i] = value
      return notify()
    }

    // constant value
    if (!changeable(dep)) {
      set(dep)
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

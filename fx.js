import channel from './channel.js'
import { changeable, observable, stream, getval } from './util.js'

export default fx

export function fx(callback, deps=[Promise.resolve().then()], sync=false) {
  let current = [], prev = []
  let changePlanned = null, destroy

  const fxChannel = channel(callback)
  const notify = () => {
    if (changePlanned) return changePlanned

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
    // constant value
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
    else if (observable(dep)) {
      dep(value => {
        current[i] = value
        notify()
      })
    }
    // node streams
    else if (stream(dep)) {
      dep.on('data', value => {
        current[i] = value
        notify()
      })
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

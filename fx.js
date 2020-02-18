import channel from './channel.js'
import { changeable, observable } from './util.js'

export default fx

export function fx(callback, deps=[ Promise.resolve().then() ]) {
  let current = [], prev = []
  let changePlanned = null, destroy

  const fxChannel = channel(callback)
  const notify = () => {
    if (changePlanned) return changePlanned
    current = current.map((arg, i) => typeof arg === 'function' ? arg(prev[i]) : arg)

    // extra tick to skip sync deps
    return changePlanned = Promise.resolve().then().then(() => {
      changePlanned = null
      if (destroy && destroy.call) destroy(...prev)
      prev = current
      destroy = fxChannel(...current)
    })
  }

  // observe changes
  deps.map(async (dep, i) => {
    if (!changeable(dep)) {
      if (typeof dep === 'function') {
        const result = dep()
        // regular fn is called any time deps change
        if (!changeable(result)) {
          current[i] = result
          await notify()
          current[i] = dep
        }
        // [async] generator is awaited
        else {
          for await (let value of result) {
            current[i] = value
            notify()
          }
        }
      }
      // constant value
      else {
        current[i] = dep
        notify()
      }
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
  })

  return fxChannel
}

export function dfx(callback, deps, prev = []) {
  return fx((...values) => {
    if (values.every((value, i) => Object.is(value, prev[i]))) return
    prev = values
    callback(...values)
  }, deps)
}

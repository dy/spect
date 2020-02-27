import bus, { _bus } from './src/bus.js'
import _observable from 'symbol-observable'

export default function fx(callback, deps=[]) {
  deps = deps.map(from)

  const channel = bus(), current = deps.map(dep => dep())
  let changed = null, destroy

  const notify = () => {
    channel(current)
    if (changed) return changed

    // extra tick to skip sync deps
    return changed = Promise.resolve().then().then().then().then(() => {
      changed = null
      if (destroy && destroy.call) destroy()
      destroy = callback(...current)
    })
  }

  deps.map((from, i) => from[_observable]().subscribe(value => notify(current[i] = value, i)))

  // instant run, if there are immediate inputs
  if (!deps.length || current.some(value => value != null)) {
    destroy = callback(...current)
  }

  return channel
}


// create an observable from any observable-like source
export function from(src) {
  let channel

  // constant (stateful)
  if (primitive(src)) {
    channel = bus(() => src)
  }
  else if (src[_bus]) {
    return src[_bus]()
  }
  // observable / observ / mutant (stateful)
  else if (observ(src)) {
    src(channel = bus(src))
  }
  // Observable, xstream, rxjs etc (stateless)
  else if (src[_observable]) {
    src[_observable]().subscribe({next: channel = bus()})
  }
  // async iterator (stateful, initial undefined)
  else if (src.next || src[Symbol.asyncIterator]) {
    let value
    channel = bus(() => value)
    ;(async () => {for await (value of src) channel(value)})()
  }
  // node streams (stateless)
  else if (src.on && src.pipe) {
    src.on('data', channel = bus(null, null, () => src.off('data', channel)))
  }
  // promise (stateful, initial undefined)
  else if (src.then) {
    let value
    channel = bus(() => value)
    src.then(result => channel(value = result))
  }
  // objects etc
  else channel = bus(() => src)

  return channel
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observ(dep) {
  return typeof dep === 'function' && 'set' in dep && !('get' in dep)
}

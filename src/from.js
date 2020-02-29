// create an observable from any observable-like source
import _observable from 'symbol-observable'
import bus, { _bus } from './bus.js'

export default function from(src) {
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

export function subscribable(arg) {
  if (primitive(arg)) return false
  return !!(arg[_bus] || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then || arg.pipe)
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observ(dep) {
  return typeof dep === 'function' && 'set' in dep && !('get' in dep)
}

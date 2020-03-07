// create an observable from any observable-like source
import _observable from 'symbol-observable'
import value from './value.js'
import channel from './channel.js'

export default function from(src, map) {
  let curr

  // constant (stateful)
  if (primitive(src)) {
    curr = (...args) => typeof args[0] === 'function' ? args[0](src) : src
  }
  // observable / observ / mutant (stateful)
  else if (typeof src === 'function') {
    curr = src
  }
  // Observable, xstream, rxjs etc (stateless)
  else if (src[_observable]) {
    // WARN: we use value instead of channel here
    // it has no-init call prevention, but further subscriptions will fire prev value
    // so ideally use `from` for a single consumer
    src[_observable]().subscribe({next: curr = value()})
  }
  // async iterator (stateful, initial undefined)
  else if (src.next || src[Symbol.asyncIterator]) {
    curr = value()
    ;(async () => {for await (const v of src) curr(v)})()
  }
  // node streams (stateless)
  else if (src.on && src.pipe) {
    src.on('data', curr = channel())
  }
  // promise (stateful, initial undefined)
  else if (src.then) {
    src.then(curr = channel())
  }
  // objects etc
  else curr = value(src)

  if (map) {
    let mapped = value()
    curr(value => mapped(map(value)))
    curr = mapped
  }

  return curr
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (primitive(arg)) return false
  return !!(typeof arg === 'function' || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then || arg.pipe)
}

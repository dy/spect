import bus from './src/bus.js'
import _observable from 'symbol-observable'

export default function fx(callback, deps=[Promise.resolve().then()]) {
  deps = deps.map(from)

  const channel = bus(), current = deps.map(dep => dep())
  let changed = null, destroy

  channel[_observable]().subscribe({ next: current => {
    if (destroy && destroy.call) destroy()
    destroy = callback(...current)
  }})

  const notify = () => {
    if (changed) return changed

    // extra tick to skip sync deps
    return changed = Promise.resolve().then().then().then().then(() => {
      changed = null
      channel(current)
    })
  }

  deps.map((from, i) => from[_observable]().subscribe({next: value => notify(current[i] = value, i)}))

  // instant run, if there are immediate inputs
  if (current.some(value => value != null)) {
    channel(current)
  }

  return channel
}


// create an observable from any observable-like source
export function from(src) {
  let channel

  // bus (any)
  if (typeof src === 'function' && src[_observable]) {
    return src
  }
  // constant (stateful)
  else if (primitive(src)) {
    channel = bus(() => src)
  }
  // observable / observ / mutant (stateful)
  else if (observ(src)) {
    src(channel = bus(src))
  }
  // Observable, xstream, rxjs etc (stateless)
  else if (observable(src)) {
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

function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

function observ(dep) {
  return typeof dep === 'function' && 'set' in dep && !('get' in dep)
}

function observable(value) {
	if (value[_observable] && value === value[_observable]()) {
		return true;
	}

	if (value['@@observable'] && value === value['@@observable']()) {
		return true;
	}
}

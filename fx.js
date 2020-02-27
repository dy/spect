import bus from './src/bus.js'


export default function fx(callback, deps=[Promise.resolve().then()]) {
  deps = deps.map(from)

  const channel = bus(), current = deps.map(dep => dep())
  let changed = null, destroy

  channel.subscribe(current => {
    if (destroy && destroy.call) destroy()
    destroy = callback(...current)
  })

  const notify = () => {
    if (changed) return changed

    // extra tick to skip sync deps
    return changed = Promise.resolve().then().then().then().then(() => {
      changed = null
      channel(current)
    })
  }

  deps.map((from, i) => from.subscribe(value => notify(current[i] = value, i)))

  // instant run, if there are immediate inputs
  if (current.some(value => value != null)) {
    channel(current)
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
  // observable / observ / mutant (stateful)
  else if (observ(src)) {
    src(channel = bus(src))
  }
  // Observable, xstream (stateless)
  else if (src.subscribe) {
    if (typeof src !== 'function') {
      src.subscribe(channel = bus())
    }
    // bus
    else channel = src
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

// create an observable from any observable-like source
export default function from(src) {
  // detect getter/setter, if src allows that
  const getter = src.get
  const setter = src.set

  let channel = bus(getter, setter)

  src.subscribe(e => channel(e))

  return channel
}



// convert any-stream to observable state
import ref from './ref.js'
import { primitive, changeable, observ } from './util.js'

// get current value of reference, changeable or alike
export function getval(v) {
  if (!v || primitive(v)) return v
  if ('current' in v) return v.current
  if ('get' in v) return v.get()
  if (Symbol.toPrimitive in v) return v[Symbol.toPrimitive]()

  // many functions are just getters: observ, state. who else?
  if (observ(v)) return v()

  // FIXME: test against other streamables

  // stateless changeables have no state
  if (changeable(v)) return

  return v
}

export default function from (target) {
  let set = ref(getval(target))

  ;(async () => {
    // constant value
    if (!changeable(target)) {
      set(target)
    }
    // async iterator
    else if (Symbol.asyncIterator in target) {
      for await (let value of target) {
        set(value)
        console.log(value, set())
      }
    }
    // promise
    else if (target.then) {
      target.then(set)
    }
    // Observable
    else if (target.subscribe) {
      target.subscribe(set)
    }
    // observable / observ / mutant
    else if (observ(target)) {
      target(set)
    }
    // node streams
    else if (stream(target)) {
      target.on('data', set)
    }
  })()

  return set
}

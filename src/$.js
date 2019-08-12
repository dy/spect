import { isIterable } from './util'

// FIXME: don't extend Array, but provide some compatible methods instead:
// length, add, remove, [idx], [-idx], iterator
// these array methods may publish events (see pub/sub below)
// But it must display as array in console


// Spect is a wrapper over any collection of elements
// It is shallow, ie. doesn't provide any data associated with itself
// All the data it provides is mirrored to collection
const spectCache = new WeakMap
class $ extends Array {
  constructor (arg, ...args) {
    super()

    // $(el|frag|text|node)
    if (arg instanceof Node) {
      this.push(arg)
      return this
    }

    // $`...tpl`
    if (arg && arg.raw) {
      return create((create(document.createDocumentFragment())).html(arg, ...args)[0].childNodes)
    }

    if (typeof arg === 'string') {
      arg = arg.trim()

      // html case $`<></> html content`
      if (/</.test(arg)) {
        let statics = [arg]
        statics.raw = [arg]
        let result = (create(document.createDocumentFragment())).html(statics, ...args)
        return create(result[0].childNodes)
      }

      arg = document.querySelector(arg)
    }

    // selector can query new els set, so we update the list
    if (typeof arg === 'string') {
      arg = document.querySelectorAll(arg)
    }

    if (isIterable(arg)) {
      this.add(...arg)
      // cache first element in the set
      // Spect(arg[0])
    }
    else this.add(arg)
  }

  // append elements to the set without duplicates
  add(...els) {
    let set = spectCache.get(this)
    if (!set) spectCache.set(this, set = new WeakSet)

    for (let i = 0; i < els.length; i++) {
      let el = els[i]
      if (!set.has(el)) {
        set.add(el)
        super.push(el)
      }
    }

    return this
  }
}

create.fn = $.prototype

// FIXME: merge with class when browsers support decorators
export default function create(...args) { return new $(...args) }
export { create, create as $ }

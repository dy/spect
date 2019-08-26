import { isIterable } from './src/util'

// FIXME: don't extend Array, but provide some compatible methods instead:
// length, add, remove, [idx], [-idx], iterator
// these array methods may publish events (see pub/sub below)
// But it must display as array in console


// Spect is a wrapper over any collection of elements
// It is shallow, ie. doesn't provide any data associated with itself
// All the data it provides is mirrored to collection
const cache = new WeakMap
class $ extends Array {
  constructor (arg, ...args) {
    super()

    if (cache.has(arg)) return cache.get(arg)

    // $(el|frag|text|node)
    if (arg instanceof Node) {
      this.push(arg)
      cache.set(arg, this)
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
      let set = new Set()

      for (let i = 0; i < arg.length; i++) {
        let el = arg[i]
        if (!set.has(el)) {
          set.add(el)
          this.push(el)
        }
      }
    }
    else {
      this[0] = arg
    }
  }
}

create.fn = $.prototype

// FIXME: merge with class when browsers support decorators
export default function create(...args) { return new $(...args) }
export { create as $ }

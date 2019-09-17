import spect from 'spect'
import nidx from 'negative-index'
import { isIterable } from './util'


const cache = new WeakMap,
      setCache = new WeakMap

export default function $spect(...args) {
  return new $(...args)
}

class $ extends Array {
  constructor(arg, ...args) {
    if (arg instanceof $) return arg
    if (cache.has(arg)) return cache.get(arg)

    super()

    setCache.set(this, new Set)

    // $('.selector')
    // FIXME live collection would require whether re-querying each fx call
    // or selector observer - probably too expensive
    if (typeof arg === 'string') {
      arg = arg.trim()

      // hyperscript: $(tagName, props, ...children?)
      // if ((args.length && args[0] == null) || isObject(args[0])) return h(arg, ...args)

      // create html: $('<></> html content')
      // if (/</.test(arg)) {
      //   let statics = [arg]
      //   statics.raw = [arg]
      //   let result = (spect(document.createDocumentFragment())).html(statics, ...args)
      //   return spect(unwrapElement(result[0].childNodes))
      // }

      // selector
      let within = document

      arg = within.querySelectorAll(arg)
    }

    // $`...tpl`
    // if (arg && arg.raw) {
    //   return spect(unwrapElement(spect(document.createDocumentFragment()).html(arg, ...args)))
    // }

    this.add(arg)

    cache.set(arg, this)

    return this
  }

  add(arg) {
    let set = setCache.get(this)
    if (!isIterable(arg)) arg = [arg]
    for (let item of arg) {
      if (set.has(item)) continue
      set.add(item)
      super.push(item)
    }

    return this
  }

  remove(arg) {
    let set = setCache.get(this)
    if (!isIterable(arg)) arg = [arg]
    for (let item of arg) {
      if (!set.has(item)) continue
      set.remove(item)
    }
    this.length = 0
    this.push(...set)

    return this
  }

  item(id) {
    // similar to .item(n)
    if (typeof id === 'number') return spect(this[nidx(id, this.length)])
    if (typeof id === 'string') return spect(this.find(el => el.id === id) || this.find(el => el.name === id) || this.find(el => el.key === id))
  }

  // default map calls Array(n)
  map(fn) {
    // FIXME: may lose props, not sure that's good
    return $spect([...this].map(fn))
  }

  then(fn) {
    return Promise.all(this).then(() => fn.call(this))
  }
}

// register regular spect effects broadcast to collections
$spect.fn = function (...fxs) {
  fxs.forEach(fx => {
    if ($.prototype[fx.name]) return

    spect.fn(fx)

    const cache = new WeakMap

    // FIXME: deps must be automated and generalized
    // FIXME: same is debounce
    Object.defineProperty($.prototype, fx.name, {
      get() {
        let fn = cache.get(this)
        if (!fn) cache.set(this, fn = broadcast(this, fx.name))
        return fn
      },
      set() { }
    })
  })
}
function broadcast(collection, name) {
  return (...args) => {
    for (let el of collection) {
      let instance = spect(el)
      let result = instance[name](...args)

      // if result is not chainable - that is getter, bail out
      if (result !== instance) return result
    }

    return collection
  }
}

// core effects
$spect.fn({ name: 'use' })
$spect.fn({ name: 'run' })
$spect.fn({ name: 'dispose' })

import spect from './core'
import nidx from 'negative-index'
import { isIterable } from './util'

const _target = Symbol.for('spect.target')

const cache = new WeakMap,
      setCache = new WeakMap

const _ = {
  $: function (arg, ...args) {
    if (arg instanceof $) return arg
    if (cache.has(arg)) return cache.get(arg)

    let el = this && this[_target] || this
    let doc = (el && el.documentElement) ? el : el && el.ownerDocument || window.document

    // $('.selector')
    if (typeof arg === 'string') {
      arg = arg.trim()

      // hyperscript: $(tagName, props, ...children?)
      // if ((args.length && args[0] == null) || isObject(args[0])) return h(arg, ...args)

      // create html: $('<></> html content')
      if (/</.test(arg)) {
        let statics = [arg]
        statics.raw = [arg]
        let $frag = spect(doc.createDocumentFragment()).html(statics)
        arg = $frag.childNodes.length == 1 ? $frag.firstChild : $frag.childNodes
      }

      // $('.selector')
      else {
        // FIXME: get global doc properly
        let within = (el && el.querySelectorAll) ? el : doc
        arg = within.querySelectorAll(arg)
      }
    }

    // $`...tpl`
    if ('html' in $.prototype) {
      if (arg && arg.raw) {
        let $frag = spect(doc.createDocumentFragment()).html(arg, ...args)
        arg = $frag.childNodes.length == 1 ? $frag.firstChild : $frag.childNodes
      }
    }

    let collection = new $(arg)
    cache.set(arg, collection)

    return collection
  }
}

export default _.$

class $ extends Array {
  constructor(arg) {
    super()

    setCache.set(this, new Set)

    this.add(arg)

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
    if (typeof id === 'number') return this[nidx(id, this.length)]
    if (typeof id === 'string') return this.find(el => el.id === id) || this.find(el => el.name === id) || this.find(el => el.key === id)
  }

  // default map calls Array(n)
  map(fn) {
    // FIXME: may lose props, not sure that's good
    return new $([...this].map(fn))
  }

  then(fn) {
    return Promise.all(this).then(() => fn.call(this))
  }
}

// register regular spect effects broadcast to collections
_.$.fn = function (...fxs) {
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

      // provide element property
      instance.element = el

      let result = instance[name](...args)

      // if result is not chainable - that is getter, bail out
      if (result !== instance) return result
    }

    return collection
  }
}

// core effects
_.$.fn({ name: 'use' })
_.$.fn({ name: 'run' })
_.$.fn({ name: 'dispose' })

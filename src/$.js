import { isIterable } from './util'

// FIXME: replace with primitive-pool WeakMap
// this cache is for faster fetching static targets' aspects
export const targetsCache = new WeakMap


// Collection keeps unique sequence of elements
let collectionCache = new WeakMap
class Collection extends Array {
  constructor (...nodes) {
    super()
    this.push(...nodes)
  }
  push(...els) {
    // don't push existing elements
    let set = collectionCache.get(this)
    if (!set) collectionCache.set(this, set = new WeakSet)

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

// Spect is collection, wrapped with effect methods
export default class $ extends Collection {
  constructor (arg, ...args) {
    super()

    // $`...tpl`
    if (arg && arg.raw) {
      return new $((new $(document.createDocumentFragment())).html(arg, ...args)[0].childNodes)
    }

    // FIXME: make sure that's worth it over $.h
    // h case $(tag, props, ...children)
    if (args.length) {
      return html.h(arg, ...args)
    }

    if (typeof arg === 'string') {
      arg = arg.trim()

      // html case $`<></>`
      if (arg[0] === '<') {
        let statics = [arg]
        statics.raw = [arg]
        let result = (new $(document.createDocumentFragment())).html(statics, ...args)
        return new $(result[0].childNodes)
      }

      arg = document.querySelector(arg)
    }

    // $(el|frag|text|node)
    if (arg instanceof Node) {
      if (!targetsCache.has(arg)) targetsCache.set(arg, this.push(arg))
      return targetsCache.get(arg)
    }

    // selector can query new els set, so we update the list
    if (typeof arg === 'string') {
      arg = document.querySelectorAll(arg)
    }

    isIterable(arg) ? this.push(...arg) : this.push(arg)
  }
}


export { $ }
export const fn = $.fn = $.prototype


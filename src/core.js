import equal from "fast-deep-equal"
import { paramCase } from './util.js'
import tuple from 'immutable-tuple'

// FIXME: provide customization ways
// export let $doc = $(document)

// current running effect
export let current = null, count = {}

// deps state associated with effect callsite
const depsCache = new WeakMap, destroyCache = new WeakMap

// record generic effect call
// if deps passed, returns promise, resolving when the effect queue comes
// if deps are skipped, always returns promise
export function COMMIT (target, effect, destroy, deps) {
  if (count[effect] === undefined) count[effect] = 0
  else count[effect]++

  let key = tuple(current, target, effect + '-' + count[effect])

  // if (arguments.length === 5) {
    // console.log(effect + '-' + count[effect], deps)
  if (deps !== undefined) {
    let prev = depsCache.get(key)

    // array dep - enter by change
    if (Array.isArray(deps)) {
      if (equal(deps, prev)) return false
      depsCache.set(key, deps)
    }

    // boolean dep - enter by truthy value
    // else if (deps) {
      //   if (equal(deps, prev)) return false
      //   depsCache.set(key, deps)
      // }
    }

  if (destroyCache.has(key)) destroyCache.get(key).call(target)
  destroyCache.set(key, destroy)

  return true
}

// register fx fn invocation
export function CALL (target, fn) {
  let prevElement = current
  let prevCount = count
  count = {}
  current = target
  fn.call(target)
  current = prevElement
  count = prevCount
}

export function SET () {

}

export function GET () {

}



// store name correspondance between function/name
let nameCache = new WeakMap
const counters = {}
export function getTagName(fn) {
  if (!fn.name) throw Error('Component function must have a name.')

  if (nameCache.has(fn)) return nameCache.get(fn)

  let name = paramCase(fn.name)

  // add num suffix to single-word names
  let parts = name.split('-')
  if (parts.length < 2) {
    if (!counters[name]) counters[name] = 0
    name += '-' + (counters[name]++)
  }

  nameCache.set(fn, name)

  return name
}


// Custom element is just a provider of constructor/attr/mount effects for main aspect
export function getCustomElement(fn, ext) {
  let name = getTagName(fn)

  let ctor = customElements.get(name)
  if (ctor) return ctor

  let proto = ext ? Object.getPrototypeOf(document.createElement(ext)).constructor : HTMLElement
  let Component = createClass(fn, proto)

  customElements.define(name, Component, ext ? { extends: ext } : undefined)

  return Component
}

// create class for custom element
function createClass(fn, HTMLElement) {
  return class HTMLSpectComponent extends HTMLElement {
    constructor() {
      super()

      // FIXME: that's wrong place for init
      // $(this).is(fn)
      $(this).use(fn)
      publish(CREATE, this, ['is'], )
    }

    connectedCallback() {
      // $.publish(MOUNT, this, ['$', name], curr, prev)
    }

    disconnectedCallback() {
      // $.publish(UNMOUNT, this, ['$', name], curr, prev)
    }
  }
}

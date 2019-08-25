import equal from "fast-deep-equal"
import { paramCase } from './util.js'

// FIXME: provide customization ways
// export let $doc = $(document)

// current running effect
export let current = null

// operations
export const GET = 1, SET = 2

// put command into queue
// if deps pass, returns promise, resolving when the effect queue comes
// if deps are skipped, always returns promise
export function commit (target, effect, command, destroy, deps) {
  current = target

  // if (arguments.length === 5) {
  // if (deps !== undefined) {
  //   // array dep - enter by change
  //   if (Array.isArray(deps)) {
  //     let depsTuple = tuple(currentElement, currentFn, fxCount)
  //     let prevDeps = depsCache.get(depsTuple) || []
  //     if (equal(deps, prevDeps)) {
  //       fxCount++
  //       return
  //     }

  //     depsCache.set(depsTuple, deps)
  //   }

  //   // boolean dep - enter by truthy value
  //   else if (deps) {

  //   }
  // }

  // let key = t(current.element, current.fn, idx)

  // destroy prev call
  // if (destroyCache.has(key)) destroyCache.get(key).call(el)

  // let destroy = fn.call(el)
  // if (typeof destroy !== 'function') destroy = noop
  // destroyCache.set(key, destroy)

  // fxCount++

  // plan call of current effect
  return new Promise(resolve => {
    current = target
    resolve()
  })
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

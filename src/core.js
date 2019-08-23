import equal from "fast-deep-equal"
import { paramCase } from './util.js'

// core manages sequences of planned commands
// each effect registers a command with params
// by the end of effect the queue is drained and necessary ops are evaluated
// like, multiple vdom calls etc.


// FIXME: provide customization ways
export let $doc = $(document)

// operations
export const GET = 1, SET = 2, CREATE = 3, DELETE = 4, START = 5, END = 6

// current effect queue
// the calls to effects are placed to queue as [command, effect, args]
export const queue = []

// put command with params into queue
// returns effect id, if deps changed
// the effect id reflects target + effect + effect order tuple, so that the callsite can be identified
export function commit (target, effect, deps) {
  let $els = target || $doc

  if (deps !== undefined) {
    // array dep - enter by change
    if (Array.isArray(deps)) {
      let depsTuple = tuple(currentElement, currentFn, fxCount)
      let prevDeps = depsCache.get(depsTuple) || []
      if (equal(deps, prevDeps)) {
        fxCount++
        return this
      }

      depsCache.set(depsTuple, deps)
    }

    // boolean dep - enter by truthy value
    else if (deps) {

    }
  }
  else {
    return true
  }

  queue.push(effect, args)
}


// microtask queue to rerender
let current = Promise.resolve()
let plan = function (fn) {
  current.then(fn)
}


// FIXME: incorporate into single
let currentElement, currentAspect, currentEffect

// hook for effects, invoking callback at the right moment with right environment
const destroyCache = new WeakMap
const depsCache = new Map


// generic fx
/*
export function fx (target, fx, fn, deps) {
  // call after aspect, if there's a queue
  if (currentQueue) {
    this.forEach(el => currentQueue.push([el, fn, fxCount]))
  }
  // or instantly - for global effects
  // FIXME: make sure if that's ok, or better do async next call maybe
  else {
    this.forEach(el => run(el, fn))
  }

  current => {
    let key = t(current.element, current.fn, idx)

    // destroy prev call
    if (destroyCache.has(key)) destroyCache.get(key).call(el)

    let destroy = fn.call(el)
    if (typeof destroy !== 'function') destroy = noop
    destroyCache.set(key, destroy)
  }

  fxCount++
}
*/



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

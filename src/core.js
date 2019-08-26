import equal from "fast-deep-equal"
import { paramCase } from './util.js'
import tuple from 'immutable-tuple'


// FIXME: provide customization ways
// export let $doc = $(document)

const aspectsCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  observables = new WeakMap

let currentElement = null, count


// render all aspects associated with element
export function UPDATE (el) {
  let prevElemenet = currentElement
  let prevCount = count
  count = {}
  currentElement = el
  let fns = cache.get(el)
  fns.forEach(fn => fn.call(el, el))
  currentElement = prevElemenet
  count = prevCount
}

// set effect property
export function SET (el, effect, path, value) {
  // render all elements depending on current observable
  observables.get(el, effect, path).forEach(el)
}

// get effect property
export function GET (el, effect, path) {
  // add current rendering element as dependendent
  observables.get(el, effect, path).add(currentElement)
}

// add aspect to the element
export function ADD (el, fn) {
  aspectsCache.get(el).add(fn)
}

// check if deps have changed for provided callsite
export function DEPS(deps, destroy) {
  if (count[effect] === undefined) count[effect] = 0
  else count[effect]++

  // FIXME: make sure that's the valid form of key, correct and fast
  // FIXME: make sure we don't need effect subject passed here to better identify callsites
  let key = tuple(current, effect + '-' + count[effect])

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

  if (destroyCache.has(key)) destroyCache.get(key).call()
  destroyCache.set(key, destroy)

  return true
}



// declare command from effect
// meaning queue is going to be read in async tick
// all recorded commands will get reactions
let planned = null
function commit (command, el, args) {
  queue.push(command, el, effect, args)

  if (planned) return
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
      // $(this).use(fn)
      ADD(this, fn)
    }

    connectedCallback() {
      // $.publish(MOUNT, this, ['$', name], curr, prev)
    }

    disconnectedCallback() {
      // $.publish(UNMOUNT, this, ['$', name], curr, prev)
    }
  }
}

import { paramCase } from './util.js'

// provides event bus, classes creation, attributes tracking


// pubsub for effect changes
export const GET = 1, SET = 2, CALL_START = 3, CALL_END = 4, CREATE = 5

export const observers = {
  [GET]: [],
  [SET]: [],
  [CALL_START]: [],
  [CALL_END]: [],
}

export function subscribe(TYPE, fn) {
  if (observers[TYPE].indexOf(fn) >= 0) return
  observers[TYPE].push(fn)
}

export function publish(TYPE, element, domain, ...args) {
  // domain → [domain, path]
  if (typeof domain === 'string') domain = [domain]
  observers[TYPE].forEach(fn => fn(element, domain, ...args))
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

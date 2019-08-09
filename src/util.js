import kebab from 'kebab-case'
import $ from './$.js'
import { create } from 'domain';


export const SPECT_CLASS = '👁'


export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}



// store name correspondance between function/name
let nameCache = new WeakMap
const counters = {}
export function getTagName (fn) {
  if (!fn.name) throw Error('Component function must have a name.')

  if (nameCache.has(fn)) return nameCache.get(fn)

  let name = kebab(fn.name).slice(1)

  // add num suffix to single-word names
  let parts = name.split('-')
  if (parts.length < 2) {
    if (!counters[name]) counters[name] = 0
    name += '-' + (counters[name]++)
  }

  nameCache.set(fn, name)

  return name
}


// TODO: custom element must be just a provider of constructor/attr/mount effects for main aspect, the rest is standard fn
let customTags = new WeakMap
export function getCustomElement (fn, ext) {
  let name = getTagName(fn)

  let ctor = customElements.get(name)
  if (ctor) return ctor

  let proto = ext ? Object.getPrototypeOf(document.createElement(ext)).constructor : HTMLElement
  let Component = createClass(fn, proto)

  customElements.define(name, Component, ext ? { extends: ext } : undefined)

  return Component
}

function createClass (fn, HTMLElement) {
  return class HTMLSpectComponent extends HTMLElement {
    constructor() {
      super()

      // FIXME: make sure that's the right place for it
      ;(new $(this)).use(fn)
    }
  }
}

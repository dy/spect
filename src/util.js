import kebab from 'kebab-case'
import $ from './$.js'


export const SPECT_CLASS = '👁'
export const SPECT_COMPONENT_PREFIX = 's'


export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

// store name correspondance between function/name
let nameCache = new WeakMap
export function getTagName (fn) {
  if (!fn.name) throw Error('Component function must have a name.')

  if (nameCache.has(fn)) return nameCache.get(fn)

  let name = SPECT_COMPONENT_PREFIX + kebab(fn.name)

  nameCache.set(fn, name)

  return name
}


// TODO: custom element must be just a provider of constructor/attr/mount effects for main aspect, the rest is standard fn
let customTags = new WeakMap
export function getCustomElement (fn, ext) {
  let name = getTagName(fn)

  let ctor = customElements.get(name)
  if (ctor) return ctor

  let proto = ext ? Object.getPrototypeOf(document.createElement(ext)) : HTMLElement

  function $Component () {
    console.log('Created class')

    ;(new $(this)).use(fn)
  }

  $Component.prototype = proto
  Object.create(proto, {
    constructor: {
      value: $Component,
      enumerable: false,
      writable: true,
      configurable: true
    }
  })

  customElements.define(name, $Component, ext ? { extends: ext } : undefined)

  return $Component
}

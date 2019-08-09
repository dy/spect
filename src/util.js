import kebab from 'kebab-case'
import $ from './$.js'


export const SPECT_CLASS = '👁'
export const SPECT_COMPONENT_PREFIX = 's'


export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}


export function getTagName (fn) {
  if (!fn.name) throw Error('Component function must have a name.')
  return SPECT_COMPONENT_PREFIX + kebab(fn.name)
}


// TODO: custom element must be just a provider of constructor/attr/mount effects for main aspect, the rest is standard fn
export function getCustomElement (name, fn) {
  // let SpectComponent = function (...args) {
  //   HTMLElement.constructor.call(this)
  //   console.log('Created class', args)
  // }
  // SpectComponent.prototype = Object.create(HTMLElement)

  class SpectComponent extends HTMLElement {
    constructor () {
      super()
      console.log('Created class')

      ;(new $(this)).use(fn)
    }
  }

  // SpectComponent.prototype = Object.getPrototypeOf($el[0])
  // Object.create(Object.getPrototypeOf($el[0]), {
  //   constructor: {
  //     value: SpectComponent,
  //     enumerable: false,
  //     writable: true,
  //     configurable: true
  //   }
  // })

  customElements.define(name, SpectComponent)

  return SpectComponent
}

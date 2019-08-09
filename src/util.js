import kebab from 'kebab-case'


export const SPECT_CLASS = '👁'
export const SPECT_COMPONENT_PREFIX = 's'


export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}


export function getTagName (fn) {
  if (!fn.name) throw Error('Component function must have a name.')
  return SPECT_COMPONENT_PREFIX + kebab(fn.name)
}


// turn function into a custom element class
// register custom element by name inferred from the function
// return tag name
export function customElement (fn) {
  let SpectComponent = function (...args) {
    console.log('Created class', args)
  }
  SpectComponent.prototype = Object.create(HTMLElement)
  // SpectComponent.prototype = Object.getPrototypeOf($el[0])
  // Object.create(Object.getPrototypeOf($el[0]), {
  //   constructor: {
  //     value: SpectComponent,
  //     enumerable: false,
  //     writable: true,
  //     configurable: true
  //   }
  // })

  return SpectComponent
}

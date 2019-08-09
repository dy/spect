import $ from './$.js'
import kebab from 'kebab-case'


$.fn.is = function is (fn) {
  if (!this[0]) return

  // TODO: if element is the component - bail out

  // TODO: if element has aspect - bail out

  // TODO: register only direct web-components, wait for extended ones from google
  // register class
  let tagName = getTagName(this, fn)
  let Class = getClass(this, fn)
  customElements.define(tagName, Class, { extends: this[0].tagName.toLowerCase() })

  // turn element into inherited class
  this.forEach(el => el.setAttribute('is', tagName))
  this.forEach(el => customElements.upgrade(el))

  return this
}


function getClass($el, fn) {
  let SpectComponent = function (...args) {
    console.log('Created class', args)
  }
  SpectComponent.prototype = Object.getPrototypeOf($el[0])
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


let anonCount = 0
function getTagName ($el, fn) {
  // FIXME: turn fn name into dash-case
  if (fn.name) {
    let name = kebab(fn.name)
    console.log(name)
  }

  // FIXME: ignore anonymous function, because we can't identify them by id
  // throw Error('Component can\'t be anonymous function - it must have a name.')
  return $el[0].tagName.toLowerCase() + '-' + (anonCount++).toString(36)
}


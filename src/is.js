import $ from './$.js'
import { run, flush } from './use.js'


$.fn.is = function is (fn) {
  if (!this[0]) return

  // TODO: if element is the component - bail out

  // TODO: if element has aspect - bail out

  // TODO: register only direct web-components, wait for extended ones from google
  // register class
  // let tagName = getTagName(this, fn)
  // let Class = getClass(this, fn)
  // customElements.define(tagName, Class, { extends: this[0].tagName.toLowerCase() })

  // // turn element into inherited class
  // this.forEach(el => el.setAttribute('is', tagName))
  // this.forEach(el => customElements.upgrade(el))


  // console.log('use', fn.name)
  // TODO: some special aspect class would allow for custom effects here
  // let aspect = tuple(this, fn)
  // queue.push(() => run(aspect))

  // flush()

  return this
}

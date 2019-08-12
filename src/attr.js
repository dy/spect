import { $, GET, SET } from './core'

// TODO attribute listens for read attributes from elements and modifies set of observed attributes via mutation observer


// observed attribute names assigned to targets, { target: [foo, bar, ...attrs] }
const observedAttributes = new WeakMap


const targetCache = new WeakMap
Object.defineProperty($.fn, 'attr', {
  get() {
    if (!targetCache.has(this)) targetCache.set(this, createAttr(this))
    return targetCache.get(this)
  },

  set(value) {
    console.log('TODO set attr', this)
  }
})


function createAttr($el) {
  let firstEl = $el[0]

  // we init attr observer if an element was read
  $el.forEach(observeAttributes)

  return new Proxy({}, {
    set: (_, name, value) => {
      $el.forEach(el => {
        let prev = el.getAttribute(name)

        // skip unchanged value
        if (Object.is(prev, value)) return

        el.setAttribute(name, value)

        // that's notified via attribute change listener in mutation observer, no need to publish here
        // $.publish(SET, el, ['attr', name], value, prev)
      })

      return true
    },

    get: (_, name) => {

      // notify all elements in the set
      $el.forEach(el => {
        // update observed attributes for target
        if (!observedAttributes.has(el)) observedAttributes.set(el, [])
        let attrs = observedAttributes.get(el)
        if (attrs.indexOf(name) < 0) attrs.push(name)

        $.publish(GET, el, ['attr', name])
      })

      // but return only first one
      return firstEl.getAttribute(name)
    }
  })
}


// safe attribs observer, skipping own custom elements
// FIXME: use attributeFilter to subfilter observed attrs as well as custom els
let elCache = new WeakSet
export function observeAttributes(el) {
  if (elCache.has(el)) return
  elCache.add(el)

  // FIXME: dispose observer on el destroy
  new MutationObserver(records => {
    for (let i = 0, length = records.length; i < length; i++) {
      let { target, oldValue, attributeName } = records[i];
      $.publish(SET, target, ['attr', attributeName], target.getAttribute(attributeName), oldValue);
    }
  }).observe(el, { attributes: true, attributeOldValue: true })
}

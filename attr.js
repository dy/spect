import { commit,  } from './src/core'


// TODO attribute listens for read attributes from elements and modifies set of observed attributes via mutation observer


export default function attr (...args) {
  if (args.length <= 1) return this.attr.get(...args)

  if (typeof args[0] === 'object') {
    for (let name in args[0]) {
      this.attr.set(name, args[0][name])
    }
    return
  }

  return this.attr.set(...args)
}

attr.get = function (name) {
  // TODO reading attribute should make sure element is clean

  // TODO also reading subscribes current target to updates of the attribute

  // TODO reading turns observer on
  // this.forEach(observeAttributes)

  // update observed attributes for target
  // if (!observedAttributes.has(el)) observedAttributes.set(el, [])
  // let attrs = observedAttributes.get(el)
  // if (attrs.indexOf(name) < 0) attrs.push(name)


  return this[0].getAttribute(name)
}
attr.set = function (name, value, deps) {
  let id = commit(this, 'attr', deps)
  if (!id) return

  this.forEach(el => {
    let prev = el.getAttribute(name)

    if (Object.is(prev, value)) return

    el.setAttribute(name, value)
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
      publish(SET, target, ['attr', attributeName], target.getAttribute(attributeName), oldValue);
    }
  }).observe(el, { attributes: true, attributeOldValue: true })
}

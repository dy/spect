import v from './v.js'
import _observable from 'symbol-observable'

export default function o (target = {}, types) {
  const descriptors = {}

  if (types) {
    [...Object.getOwnPropertySymbols(types), ...Object.getOwnPropertyNames(types)]
    .map(name => descriptors[name] = {type: types[name], enumerable: true})
  }
  // detect the safest manually defined available props
  // (no custom behavior, no private, no numeric, no custom names, no symbols, not function etc.)
  else if (!Array.isArray(target)) {
    Object.keys(target)
    .filter(name => (
      typeof target[name] !== 'function' &&
      /^[A-Za-z]/.test(name)
    ))
    // own props don't define coercion - it is a bit unnatural to js op, leave it to user
    .map(name => {
      descriptors[name] = { type: null, enumerable: true }
    })
  }

  // take init attributes as well
  // FIXME: map camelCase props to dashCase attribs
  if (target.attributes) {
    [...target.attributes]
      .map(({name, value}) => name)
      .filter(name =>
        !(name in target) &&
        name !== 'id' &&
        name !== 'class' &&
        name.slice(0,5) !== 'data-' &&
        name.slice(0,5) !== 'aria-'
      )
      .map(name => {
        descriptors[name] = descriptors[name] || { type: null, enumerable: true }
        if (!(name in target)) {
          let value = getAttribute(target, name)
          if (descriptors[name].type) value = descriptors[name].type(value)
          target[name] = value
        }
      })
  }

  const value = v()
  value.set(target)

  // set attribute observer
  if (target.setAttribute) {
    const mo = new MutationObserver((records) => records.map(({attributeName: name}) => {
      let attr = getAttribute(target, name)
      if (descriptors[name] && descriptors[name].type) attr = descriptors[name].type(attr)
      if (target[name] !== attr) target[name] = attr
    }))
    mo.observe(target, { attributes: true, attributeFilter: Object.keys(descriptors) })
    value.subscribe(null, null, () => mo.disconnect())
  }

  [...Object.getOwnPropertyNames(descriptors), ...Object.getOwnPropertySymbols(descriptors)].map(name => {
    let descriptor = descriptors[name]
    let orig = descriptor.orig = Object.getOwnPropertyDescriptor(target, name)

    descriptor.enumerable = true

    // bind prop
    descriptor.get = () => {
      return orig ? (
        orig.get ? orig.get.call(target) :
        orig.value
      ) : descriptor.value
    }
    descriptor.set = v => {
      v = !descriptor.type || v == null || (v instanceof descriptor.type) ? v : descriptor.type(v)
      target.setAttribute ? setAttribute(target, name, v) : null
      orig ? (orig.set ? orig.set.call(target, v) : orig.value = v) : descriptor.value = v
      value(target)
    }
  })

  Object.defineProperties(target, descriptors)


  value.subscribe(null, null, () => {
    let orig = {}
    for (let name in descriptors) if (descriptors[name].orig) orig[name] = descriptors[name].orig
    Object.defineProperties(target, orig)
  })

  const proxy = new Proxy(target, {
    get(target, prop) {
      if (value.canceled) return
      if (prop === _observable) return () => value
      return target[prop]
    },
    has(target, prop) {
      if (value.canceled) return
      if (prop === _observable) return true
      return prop in target
    },
    set(target, prop, v) {
      if (value.canceled) return true
      target[prop] = v
      // for the cases when some unobserved prop is set (observed prop updates via defined setter)
      if (!descriptors[prop]) {
        if (target.setAttribute) setAttribute(target, prop, v)
        value(target)
      }
      return true
    },
    deleteProperty(target, prop) {
      if (prop in target) {
        delete target[prop]
        delete descriptors[prop]
        value(target)
        return true
      }
      else {
        return false
      }
    }
  })

  // sync up initial attributes with values
  if (target.attributes) {
    for (let name in descriptors) target[name] = target[name]
  }

  return proxy
}

function getAttribute (el, name, value) { return (value = el.getAttribute(name)) === '' ? true : value }

function setAttribute (el, name, value) {
  if (value === false || value == null) {
    el.removeAttribute(name)
  }
  // class=[a, b, ...c] - possib observables
  else if (Array.isArray(value)) {
    el.setAttribute(name, value.filter(Boolean).join(' '))
  }
  // style={}
  else if (typeof value === 'object') {
    el.setAttribute(name, Object.keys(value).map((key, i) => `${key}: ${value[i]};`).join(' '))
  }
  else {
    el.setAttribute(name, value === true ? '' : value)
  }
}

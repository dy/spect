import v from './v.js'
import _observable from 'symbol-observable'

export default function o (target = {}, types = {}) {
  // create descriptors on target
  const descriptors = {}

  // take in defined types
  for (let name in types) descriptors[name] = { type: types[name], enumerable: true }

  // detect types from target own props
  let ownProps = Object.getOwnPropertyNames(target)
  ownProps.map(name => {
    if (!descriptors[name]) descriptors[name] = { type: type(target[name]), enumerable: true }
  })

  // // bind attribute
  // if (target.nodeType) {
  //   // FIXME: create single MO per target
  //   const mo = new MutationObserver((records) => records.map(({attributeName}) => {
  //     target[attributeName] = target.getAttribute(attributeName)
  //   }))
  //   mo.observe(target, { attributes: true, attributeFilter: Object.getOwnPropertyNames(descriptors) })
  //   value(null, null, () => mo.disconnect())
  // }

  const value = v(target)

  for (let name in descriptors) {
    let descriptor = descriptors[name]
    let orig = descriptor.orig = Object.getOwnPropertyDescriptor(target, name)

    // bind prop
    descriptor.get = orig ? (orig.get ? orig.get.bind(target): () => orig.value) : () => descriptor.value
    descriptor.set = v => (
      v = !descriptor.type || (v instanceof descriptor.type) ? v : descriptor.type(v),
      orig ? (orig.set ? orig.set.call(target, v) : orig.value = v) : descriptor.value = v,
      value(target)
    )
  }

  Object.defineProperties(target, descriptors)
  value.subscribe(null, null, () => {
    let orig = {}
    for (let name in descriptors) if (descriptors[name].orig) orig[name] = descriptors[name].orig
    Object.defineProperties(target, orig)
  })

  const proxy = new Proxy(target, {
    get(target, prop) {
      if (prop === _observable) return () => value
      return target[prop]
    },
    has(target, prop) {
      if (prop === _observable) return true
      return prop in target
    },
    set(target, prop, value) {
      target[prop] = value
      if (!descriptors[prop]) value(target)
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

  return proxy
}

function type(arg) {
  if (arg == null) return v => v
  if (typeof arg === 'boolean') return Boolean
  if (typeof arg === 'string') return String
  if (typeof arg === 'number') return Number
  return Object.getPrototypeOf(arg).constructor
}

// // attr
// attr.get = (el, name, value) => ((value = el.getAttribute(name)) === '' ? true : value)
// attr.set = (el, name, value) => {
//   if (value === false || value == null) el.removeAttribute(name)
//   else el.setAttribute(name, value === true ? '' : value)
// }


// // inputs
// const get = el.type === 'checkbox' ? () => el.checked : () => el.value

// const set = {
//   text: value => el.value = (value == null ? '' : value),
//   checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
//   'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
// }[el.type]

// // prop


// // local storage

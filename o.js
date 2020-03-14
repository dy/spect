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

  // take in set attributes
  if (target.attributes) {
    [...target.attributes].map(({ name, value }) => {
      if (!descriptors[name]) {
        descriptors[name] = { type: null, enumerable: true }
        target[name] = value
      }
    })
  }

  const value = v()
  value.set(target)

  // set attribute observer
  if (target.setAttribute) {
    const mo = new MutationObserver((records) => records.map(({attributeName: name}) => {
      let attr = descriptors[name].type(target.getAttribute(name))
      if (target[name] !== attr) target[name] = attr
    }))
    mo.observe(target, { attributes: true, attributeFilter: Object.keys(descriptors) })
    value.subscribe(null, null, () => mo.disconnect())
  }

  for (let name in descriptors) {
    let descriptor = descriptors[name]
    let orig = descriptor.orig = Object.getOwnPropertyDescriptor(target, name)

    // bind prop
    descriptor.get = orig ? (orig.get ? orig.get.bind(target): () => orig.value) : () => descriptor.value
    descriptor.set = v => (
      v = !descriptor.type || v == null || (v instanceof descriptor.type) ? v : descriptor.type(v),
      target.setAttribute ? setAttribute(target, name, v) : null,
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

  // sync up initial attributes with values
  for (let name in descriptors) target[name] = target[name]

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

function setAttribute (el, name, value) {
  // class=[a, b, ...c] - possib observables
  if (Array.isArray(value)) {
    values.filter(v => v).join(' ')
  }
  // style={}
  else if (typeof value === 'object') {
    el.setAttribute(name, Object.keys(value).map((key, i) => `${key}: ${value[i]};`).join(' '))
  }
  else if (value === false || value == null) {
    el.removeAttribute(name)
  }
  else {
    el.setAttribute(name, value === true ? '' : value)
  }
}


// // inputs
// const get = el.type === 'checkbox' ? () => el.checked : () => el.value

// const set = {
//   text: value => el.value = (value == null ? '' : value),
//   checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
//   'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
// }[el.type]

// // prop


// // local storage

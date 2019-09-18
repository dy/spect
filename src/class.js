import equal from 'fast-deep-equal'

const _sub = Symbol.for('spect.subscribe')
const _pub = Symbol.for('spect.publish')
const _deps = Symbol.for('spect.deps')
const _target = Symbol.for('spect.target')

const stateCache = new WeakMap
const getValues = el => {
  let obj = {}
  for (let cl of el.classList) obj[cl.name] = cl.value
  return obj
}
const getValue = (el, name) => el.classList.contains(name),
  setValue = (el, name, value) => {
    if (!value) el.classList.remove(name)
    else el.classList.add(name)
    return this
  },
  setValues = (el, obj) => {
    for (let name in obj) setValue(el, name, obj[name])
    return this
  },
  template = function (...args) {
    let str = String.raw(...args)
    this.forEach(el => el.className = str)
    return this
  },
  effectName = 'class'

let exp = {
  class: function (...args) {
  const target = this[_target] || this

  // effect()
  if (!args.length) {
    this[_sub] && this[_sub](effectName)
    return getValues(target)
  }

  // effect`...`
  if (args[0].raw) {
    return template(target, ...args)
  }

  // effect(s => {...}, deps)
  if (typeof args[0] === 'function') {
    let [fn, deps] = args
    if (this[_deps] && !this[_deps](deps)) return this

    let state = getValues(target)
    let result
    try {
      result = fn(new Proxy(state, {
        set: (t, prop, value) => {
          if (this[_pub]) if (t[prop] !== value) this[_pub](effectName + '.' + prop)
          return Reflect.set(t, prop, value)
        }
      }))
    } catch (e) { }

    if (result !== state && typeof result === typeof state) {
      setValues(target, result)

      if (this[_pub]) {
        this[_pub](effectName)
        for (let name in result) this[_pub](effectName + '.' + name)
      }
    }

    return this
  }

  // effect(name)
  if (args.length == 1 && (typeof args[0] === 'string')) {
    let [name] = args

    this[_sub] && this[_sub](effectName + '.' + name)

    return getValue(target, name)
  }

  // effect(obj, deps)
  if (typeof args[0] === 'object') {
    let [props, deps] = args
    if (this[_deps] && !this[_deps](deps)) return this

    let prev = getValues(target)

    if (!equal(prev, props)) {
      setValues(target, props)

      if (this[_pub]) {
        this[_pub](effectName)
        for (let name in props) this[_pub](effectName + '.' + name)
      }
    }

    return this
  }

  // effect(name, value, deps)
  if (args.length >= 2) {
    let [name, value, deps] = args
    if (this[_deps] && !this[_deps](deps)) return this

    let prev = getValue(target, name)
    if (equal(prev, value)) return this
    setValue(target, name, value)
    this[_pub] && this[_pub](effectName + '.' + name)
  }
}
}

export default exp.class

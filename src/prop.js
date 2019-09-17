import equal from 'fast-deep-equal'

const _sub = Symbol.for('spect.subscribe')
const _pub = Symbol.for('spect.publish')
const _deps = Symbol.for('spect.deps')
const _target = Symbol.for('spect.target')


const template = (el, ...args) => el[String.raw(...args)],
  getValue = (el, name) => el[name],
  getValues = el => el,
  setValue = (el, name, value) => el[name] = value,
  setValues = (el, values) => Object.assign(el, values),
  effectName = 'prop'


export default function prop(...args) {
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

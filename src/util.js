import kebab from 'kebab-case'
import equal from 'fast-deep-equal'

const _sub = Symbol.for('spect.subscribe')
const _pub = Symbol.for('spect.publish')
const _deps = Symbol.for('spect.deps')
const _target = Symbol.for('spect.target')

export const SPECT_CLASS = '👁'

export function isIterable(val) {
  if (val instanceof Node) return false
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export function isPrimitive(arg) {
  try { new WeakSet([arg]); return false } catch (e) {
    return true
  }
}

export function createEffect({name: effectName, getValues, getValue, setValues, setValue, template }) {
  let _ = {[effectName]: function (...args) {
    const target = this[_target] || this

    // effect()
    if (!args.length) {
      this[_sub] && this[_sub](effectName)
      return getValues.call(this, target)
    }

    // effect`...`
    if (args[0].raw) {
      return template.call(this, target, ...args)
    }

    // effect(s => {...}, deps)
    if (typeof args[0] === 'function') {
      let [fn, deps] = args
      if (this[_deps] && !this[_deps](deps)) return this

      let state = getValues.call(this, target)
      let result
      try {
        result = fn(new Proxy(state, {
          set: (t, prop, value) => {
            if (this[_pub]) if (t[prop] !== value) this[_pub](effectName + '.' + prop)
            setValue.call(this, target, prop, value)
            return Reflect.set(t, prop, value)
          }
        }))
      } catch (e) { }

      if (result !== state && typeof result === typeof state) {
        setValues.call(this, target, result)

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

      return getValue.call(this, target, name)
    }

    // effect(obj, deps)
    if (typeof args[0] === 'object') {
      let [props, deps] = args
      if (this[_deps] && !this[_deps](deps)) return this

      let prev = getValues.call(this, target)

      if (!equal(prev, props)) {
        setValues.call(this, target, props)

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

      let prev = getValue.call(this, target, name)
      if (equal(prev, value)) return this
      setValue.call(this, target, name, value)
      this[_pub] && this[_pub](effectName + '.' + name)
    }

    return this
  }}

  return _[effectName]
}

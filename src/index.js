import spect, { registerEffect } from './core'

spect.use = function (...fxs) {
  fxs.forEach(fx => fx && fx.name && registerEffect(fx.name, fx))
}

const stateCache = new WeakMap
function getValues(el) {
  let state = stateCache.get(el)
  if (!state) stateCache.set(el, state = {})
  return state
}
spect.use(
  function fx(test) {
    return function (fn, deps) {
      if (!test(deps, () => destroy.forEach(fn => fn && fn.call && fn()))) return this

      let destroy = []

      this.queue(() => destroy.push(fn.call(el)))

      return this
    }
  },
  {
    name: 'state',
    getValues,
    getValue: (el, name) => getValues(el)[name],
    setValue: (el, name, value) => getValues(el)[name] = value,
    setValues: (el, obj) => Object.assign(getValues(el), obj),
    template: (el, ...args) => getValues(el)[String.raw(...args)]
  },
  {
    template: (el, ...args) => el[String.raw(...args)],
    getValue: (el, name) => el[name],
    getValues: el => el,
    setValue: (el, name, value) => el[name] = value,
    setValues: (el, values) => Object.assign(el, values)
  }
)

export default spect
export { registerEffect }

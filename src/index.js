import { spect, registerEffect } from './core'

registerEffect('fx', () => {

  // FIXME should be elegant
  return {
    deps: true,
    reduce: function (el, fn) {
      () => destroy.forEach(fn => fn && fn())

      let destroy = []

      this.queue(() => {
        let destructor = fn.call(el)
        destroy.push(typeof destructor === 'function' ? destructor : noop)
      })
    }
  }
})

const stateCache = new WeakMap
registerEffect('state', () => {
  function getValues(el) {
    let state = stateCache.get(el)
    if (!state) stateCache.set(el, state = {})
    return state
  }

  return {
    deps: true,
    getValues,
    getValue: (el, name) => pget(getValues(el), name),
    setValue: (el, name, value) => pset(getValues(el), name, value),
    setValues: (el, obj) => Object.assign(getValues(el), obj),
    template: (el, ...args) => pget(getValues(el), String.raw(...args))
}})

registerEffect('prop', {
  deps: true,
  template: (el, ...args) => el[String.raw(...args)],
  getValue: (el, name) => el[name],
  getValues: el => el,
  setValue: (el, name, value) => el[name] = value,
  setValues: (el, values) => Object.assign(el, values)
})

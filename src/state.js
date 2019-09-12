const stateCache = new WeakMap
function getValues(el) {
  let state = stateCache.get(el)
  if (!state) stateCache.set(el, state = {})
  return state
}
export default {
  name: 'state',
  getValues,
  getValue: (el, name) => getValues(el)[name],
  setValue: (el, name, value) => getValues(el)[name] = value,
  setValues: (el, obj) => Object.assign(getValues(el), obj),
  template: (el, ...args) => getValues(el)[String.raw(...args)]
}

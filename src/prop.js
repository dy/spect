export default {
  name: 'prop',
  template: (el, ...args) => el[String.raw(...args)],
  getValue: (el, name) => el[name],
  getValues: el => el,
  setValue: (el, name, value) => el[name] = value,
  setValues: (el, values) => Object.assign(el, values)
}

import {createEffect} from './util'
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

export default createEffect({
  template,
  getValue,
  getValues,
  setValue,
  setValues,
  name: effectName
})

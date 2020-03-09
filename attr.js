import value from './value.js'

export default function attr (el, name) {
  const curr = value(undefined), { cancel, next } = curr

  curr.get = () => attr.get(el, name)
  curr.set = (value) => (attr.set(el, name, value), next(curr.get()))
  curr.cancel = () => (mo.disconnect(), cancel())

  // no need to check all records - just push next value if that's touched
  const mo = new MutationObserver(() => curr.next(curr.get()))
  mo.observe(el, { attributes: true, attributeFilter: [name] })

  return curr
}

attr.get = (el, name, value) => ((value = el.getAttribute(name)) === '' ? true : value)
attr.set = (el, name, value) => {
  if (value === false || value == null) el.removeAttribute(name)
  else el.setAttribute(name, value === true ? '' : value)
}


export function attrs() {

}

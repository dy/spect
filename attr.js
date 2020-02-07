import ref, { _notify } from './ref.js'

const cache = new WeakMap

export default function attr(el, name) {
  let refs = cache.get(el)
  if (!refs) cache.set(el, refs = {})
  if (refs[name]) return refs[name]

  const attr = refs[name] = ref(el.getAttribute(name))
  attr.get = () => {
    let value = el.getAttribute(name)
    return !value ? el.hasAttribute(name) : value
  }
  attr.set = value => {
    if (typeof value === 'function') value = value(attr.get())
    if (value === attr.get()) return
    if (value === true) el.setAttribute(name, '')
    else if (value === false || value == null) el.removeAttribute(name)
    else el.setAttribute(value)
    attr[_notify]()
  }

  // FIXME: observer notifies unchanged attributes too
  const observer = new MutationObserver(attr[_notify])
  observer.observe(el, { attributes: true, attributeFilter: [name] })

  return attr
}

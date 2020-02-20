import ref, { _n, _p } from './src/ref.js'

const cache = new WeakMap

export default function attr(el, name) {
  let refs = cache.get(el)
  if (!refs) cache.set(el, refs = {})
  if (refs[name]) return refs[name]

  const attr = refs[name] = ref(el.getAttribute(name))
  attr.canceled = false
  attr.get = () => {
    let value = el.getAttribute(name)
    return value === '' ? true : value
  }
  attr.set = value => {
    if (attr[_p].isCanceled) throw Error('Set after cancel')
    if (value === attr.get()) return
    if (value === true) el.setAttribute(name, '')
    else if (value === false || value == null) el.removeAttribute(name)
    else el.setAttribute(name, value)
    attr[_n]()
  }

  // FIXME: observer notifies unchanged attributes too
  const observer = new MutationObserver(rx => {
    rx.forEach(rec => {
      if (rec.oldValue !== el.getAttribute(name)) {
        attr[_n]()
      }
    })
  })
  observer.observe(el, { attributes: true, attributeFilter: [name], attributeOldValue: true })

  const cancel = attr.cancel
  attr.cancel = () => {
    cancel()
    observer.disconnect()
  }

  return attr
}

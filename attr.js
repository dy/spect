import bus from './src/bus.js'

const cache = new WeakMap

export default function attr(el, name) {
  let refs = cache.get(el)
  if (!refs) cache.set(el, refs = {})
  if (refs[name]) return refs[name]

  const attr = refs[name] = bus(
    () => {
      let value = el.getAttribute(name)
      return value === '' ? true : value
    },
    (value) => {
      if (value === attr()) return
      if (value === true) el.setAttribute(name, '')
      else if (value === false || value == null) el.removeAttribute(name)
      else el.setAttribute(name, value)
    },
    () => observer.disconnect()
  )

  // FIXME: observer notifies unchanged attributes too
  const observer = new MutationObserver(rx => {
    rx.forEach(rec => {
      if (rec.oldValue !== el.getAttribute(name)) {
        attr(attr())
      }
    })
  })
  observer.observe(el, { attributes: true, attributeFilter: [name], attributeOldValue: true })

  return attr
}

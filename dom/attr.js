import state from '../core/state.js'

const CANCEL = null

export default function attr (el, name) {
  const get = attr.get.bind(null, el, name)
  const set = attr.set.bind(null, el, name)
  const curr = state(get())
  curr(set)

  const mo = new MutationObserver(rx => rx.forEach(rec => rec.oldValue !== el.getAttribute(name) && curr(get())))
  mo.observe(el, { attributes: true, attributeFilter: [name], attributeOldValue: true })

  return (...args) => (
    (args[0] === CANCEL && mo.disconnect()),
    curr(...args)
  )
}

attr.get = (el, name, value) => ((value = el.getAttribute(name)) === '' ? true : value)
attr.set = (el, name, value) => {
  if (value === false || value == null) el.removeAttribute(name)
  else el.setAttribute(name, value === true ? '' : value)
}


export function attrs() {

}

import state from './state.js'

const CANCEL = null

export default (el, name) => {
  const get = value => ((value = el.getAttribute(name)) === '' ? true : value)

  const curr = state(get())

  curr(value => {
    if (value === false || value == null) el.removeAttribute(name)
    else el.setAttribute(name, value === true ? '' : value)
  })

  const mo = new MutationObserver(rx => rx.forEach(rec => rec.oldValue !== el.getAttribute(name) && curr(get())))
  mo.observe(el, { attributes: true, attributeFilter: [name], attributeOldValue: true })

  return (...args) => (
    args[0] === CANCEL && mo.disconnect(),
    curr(...args)
  )
}

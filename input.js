import value from './value.js'

const CANCEL = null

export default function input (el) {
  const get = {
      text: () => el.value,
      checkbox: () => el.checked
    }[el.type],
    set = {
      text: value => el.value = (value == null ? '' : value),
      checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked'))
    }[el.type],
    update = e => curr(get())

  const curr = value(get())

  // external get/set
  curr(set)

  // init
  // update()

  el.addEventListener('change', update)
  el.addEventListener('input', update)

  return (...args) => (
    !args.length ? get() :
    (args[0] === CANCEL && (
      el.removeEventListener('change', update),
      el.removeEventListener('input', update)
    ), curr(...args))
  )
}

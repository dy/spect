import value from './value.js'

export default function input (el) {
  const curr = value(undefined)

  curr.get = {
      text: () => el.value,
      checkbox: () => el.checked,
      'select-one': () => el.value
    }[el.type]

  curr.set = {
      text: value => el.value = (value == null ? '' : value),
      checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
      'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
    }[el.type]

  const { cancel, next, get, set } = curr

  // normalize initial value
  set(get())

  const update = e => (set(get()), next(get()))
  el.addEventListener('change', update)
  el.addEventListener('input', update)


  curr.cancel = () => (
    cancel(),
    el.removeEventListener('change', update),
    el.removeEventListener('input', update),
    curr.set = () => {}
  )

  return curr
}

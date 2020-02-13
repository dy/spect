import ref from './ref.js'

export default function input (el) {
  const value = ref()

  const set = value.set
  value.set = (value) => {
    set(el.value = value)
  }
  value.get = () => el.value

  const update = e => {
    value(e.target.value)
  }

  el.addEventListener('change', update)
  el.addEventListener('input', update)

  const cancel = value.cancel
  value.cancel = () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
    cancel()
  }

  return value
}

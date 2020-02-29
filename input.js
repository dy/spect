import bus from './src/bus.js'

export default function input (el) {
  const update = e => {
    channel(el.value)
  }
  el.addEventListener('change', update)
  el.addEventListener('input', update)

  const channel = bus(() => el.value, value => el.value = value, () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
  })

  return channel
}

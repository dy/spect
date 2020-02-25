import bus from './src/bus.js'

export default function input (el) {
  const update = e => channel(el.value)
  el.addEventListener('change', update)
  el.addEventListener('input', update)

  const channel = bus(() => el.value, value => {
    let prevValue = prev
    prev = el.value = value
    if (prevValue !== value) el.dispatchEvent(new Event('change'))
  }, () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
  })
  let prev = channel()

  return channel
}

import { slice } from './src/util.js'
import Channel from './src/channel.js'

export default function i(el) {
  if (el.raw) el = document.querySelector(String.raw.apply(null, arguments))

  const iget = el.type === 'checkbox' ? () => el.checked : () => el.value
  const iset = ({
    text: value => el.value = (value == null ? '' : value),
    checkbox: value => (
      el.checked = value,
      el.value = (value ? 'on' : ''),
      value ? el.setAttribute('checked', '') : el.removeAttribute('checked')
    ),
    'select-one': value => {
      slice(el.options).map(el => el.removeAttribute('selected'))
      el.value = value
      if (el.selectedOptions[0]) el.selectedOptions[0].setAttribute('selected', '')
    }
  })[el.type]

  const channel = new Channel(iget, iset)

  // normalize initial value
  iset(channel.current = iget())

  const update = e => (iset(iget()), channel.push(iget()))
  el.addEventListener('change', update)
  el.addEventListener('input', update)
  channel.subscribe(null, null, () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
  })

  return channel.fn
}

const input = (arg) => arg && (arg.tagName === 'INPUT' || arg.tagName === 'SELECT')

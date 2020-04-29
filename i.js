import { desc, channel as Channel, observer, symbol } from './src/util.js'

export default function i(el) {
  if (el.raw) el = document.querySelector(String.raw(...arguments))

  const channel = Channel()

  function fn (...args) {
    if (channel.closed) return
    if (!args.length) return iget()
    if (observer(...args)) {
      let unsubscribe = channel.subscribe(...args)
      channel.push.call(channel.observers.slice(-1), iget(), iget())
      return unsubscribe
    }
    return iset(...args)
  }

  const iget = el.type === 'checkbox' ? () => el.checked : () => el.value
  const iset = ({
    text: value => el.value = (value == null ? '' : value),
    checkbox: value => (
      el.checked = value,
      el.value = (value ? 'on' : ''),
      value ? el.setAttribute('checked', '') : el.removeAttribute('checked')
    ),
    'select-one': value => {
      [...el.options].map(el => el.removeAttribute('selected'))
      el.value = value
      if (el.selectedOptions[0]) el.selectedOptions[0].setAttribute('selected', '')
    }
  })[el.type]

  // normalize initial value
  iset(iget())

  const update = e => (iset(iget()), channel.push(iget()))
  el.addEventListener('change', update)
  el.addEventListener('input', update)
  channel.subscribe(null, null, () => {
    el.removeEventListener('change', update)
    el.removeEventListener('input', update)
  })

  Object.defineProperties(fn, {
    valueOf: desc(iget),
    toString: desc(iget),
    [Symbol.toPrimitive]: desc(iget),
    [symbol.observable]: desc(() => channel),
    [symbol.dispose]: desc(channel.close),
    [Symbol.asyncIterator]: desc(async function*() {
      let resolve = () => {}, buf = [], p,
      unsubscribe = fn(v => (
        buf.push(v),
        resolve(),
        p = new Promise(r => resolve = r)
      ))
      try {
        while (1) {
          while (buf.length) yield buf.shift()
          await p
        }
      } catch {
      } finally {
        unsubscribe()
      }
    })
  })

  return fn
}

const input = (arg) => arg && (arg.tagName === 'INPUT' || arg.tagName === 'SELECT')

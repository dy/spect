import _observable from 'symbol-observable'
import c, { observer } from './channel.js'

export default function f(init, map, unmap) {
  const channel = c()

  if (!map) map = unmap = v => v

  const value = Object.assign((...args) => (
    !args.length ? (value.get && value.get()) :
    observer(...args) ? value.subscribe(...args) :
    (value.set && value.set(...args))
  ), channel)

  // add listener
  value.subscribe = callback => {
    channel.subscribe(callback)
    // callback is registered as the last channel subscription, so send it immediately as value
    if (value.get) channel.next(value.get(), channel.subs.slice(-1))
  }

  // init source
  let unsubscribe

  // group
  if (Array.isArray(init)) {
    let vals = []
    const depsChannel = c()
    init = init.map((dep, i) => {
      let depv = f(dep)
      depv(v => (vals[i] = v, depsChannel(vals)))
      return depv
    })
    value.get = () => map(vals)
    depsChannel(v => value.next(value.get()))
    if (vals.length) depsChannel(vals)
    if (unmap) value.set = v => value.next(vals = unmap(v))
    unsubscribe = () => (deps.map(depv => depv.cancel()), depsChannel.cancel())
  }
  // observ
  else if (typeof init === 'function') {
    value.set = v => init(unmap(v))
    value.get = () => map(init())
    const out = init(v => value.next(map(v)))
    unsubscribe = () => (out(), delete value.get, delete value.set)
  }
  // input
  else if (init && init.nodeType) {
    const el = init

    const get = value.get = el.type === 'checkbox' ? () => el.checked : () => el.value

    const set = {
      text: value => el.value = (value == null ? '' : value),
      checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
      'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
    }[el.type]

    value.set = v => (set(v), value.next(get()))

    // normalize initial value
    set(get())

    const update = e => value.set(get())
    el.addEventListener('change', update)
    el.addEventListener('input', update)
    unsubscribe = () => (
      delete value.set,
      el.removeEventListener('change', update),
      el.removeEventListener('input', update)
    )
  }
  // Observable (stateless)
  else if (init && init[_observable]) {
    unsubscribe = init[_observable]().subscribe({next: v => value.next(map(v))})
    unsubscribe = unsubscribe.unsubscribe || unsubscribe
  }
  // async iterator (stateful, initial undefined)
  else if (init && (init.next || init[Symbol.asyncIterator])) {
    let stop
    ;(async () => {
      for await (let v of init) {
        if (stop) break
        value.next(map(v))
      }
    })()
    unsubscribe = () => stop = true
  }
  // promise (stateful, initial undefined)
  else if (init && init.then) {
    init.then(v => (v = map(v), value.get = () => v, value.next(v)))
  }
  // plain value
  else {
    const get = _ => map(init)
    if (arguments.length) value.get = get
    value.set = v => (init = unmap(v), value.get = value.get || get, value.next(v))
  }

  value.valueOf = value.toString = value[Symbol.toPrimitive] = value.get

  // cancel subscriptions, dispose
  value.cancel = () => {
    if (unsubscribe) unsubscribe()
    channel.cancel()
    delete value.current
  }

  return value
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (!arg) return false
  return !!(typeof arg === 'function' || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then)
}

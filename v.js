import _observable from 'symbol-observable'
import c, { observer } from './channel.js'

export default function f(init, map=v=>v, unmap=v=>v) {
  const channel = c()

  const value = Object.assign((...args) => (
    !args.length ? value.get() :
    observer(...args) ? value.subscribe(...args) :
    value.set(...args)
  ), channel)

  // add listener
  value.subscribe = callback => {
    let unsubscribe = channel.subscribe(callback)
    // callback is registered as the last channel subscription, so send it immediately as value
    if ('current' in value) channel.next(value.get(), channel.subs.slice(-1))
    return unsubscribe
  }

  // current is mapped value (map can be heavy)
  value.get = () => value.current

  // init source
  let unsubscribe

  // group
  if (Array.isArray(init)) {
    let vals = value.current = []
    const depsChannel = c()
    const deps = init.map((dep, i) => {
      let depv = f(dep)
      depv(v => (vals[i] = v, depsChannel(vals)))
      return depv
    })
    depsChannel(v => value.next(value.current = map(v)))
    if (vals.length || !init.length) depsChannel(vals)
    value.set = v => (value.next(value.current = map(unmap(v))))
    unsubscribe = () => (deps.map(depv => depv.cancel()), depsChannel.cancel())
  }
  // observ
  else if (typeof init === 'function') {
    value.set = v => init(unmap(v))
    unsubscribe = init(v => value.next(value.current = map(v)))
  }
  // input
  else if (init && init.nodeType) {
    const el = init

    const get = el.type === 'checkbox' ? () => el.checked : () => el.value

    const set = {
      text: value => el.value = (value == null ? '' : value),
      checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
      'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
    }[el.type]

    value.set = v => (set(unmap(v)), value.next(value.current = get()))
    // normalize initial value
    value.set(get())

    const update = e => value.set(get())
    el.addEventListener('change', update)
    el.addEventListener('input', update)
    unsubscribe = () => (
      value.set = noop,
      el.removeEventListener('change', update),
      el.removeEventListener('input', update)
    )
  }
  // Observable (stateless)
  else if (init && init[_observable]) {
    value.set = noop
    unsubscribe = init[_observable]().subscribe({next: v => value.next(value.current = map(v))})
    unsubscribe = unsubscribe.unsubscribe || unsubscribe
  }
  // async iterator (stateful, initial undefined)
  else if (init && (init.next || init[Symbol.asyncIterator])) {
    let stop
    ;(async () => {
      for await (let v of init) {
        if (stop) break
        value.next(value.current = map(v))
      }
    })()
    value.set = noop
    unsubscribe = () => stop = true
  }
  // promise (stateful, initial undefined)
  else if (init && init.then) {
    value.set = p => (delete value.current, p.then(v => value.next(value.current = map(v))))
    value.set(init)
  }
  // plain value
  else {
    value.set = v => value.next(value.current = map(unmap(v)))
    if (arguments.length) value.set(init)
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

function noop () {}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (!arg) return false
  return !!(typeof arg === 'function' || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then)
}

import _observable from 'symbol-observable'
import c, { observer } from './channel.js'


export default function v(init, map = v => v) {
  const channel = c()

  const value = Object.assign((...args) => (
    !args.length ? (value.get && value.get()) :
    observer(...args) ? value.subscribe(...args) :
    (value.set && value.set(...args))
  ), channel)

  // default set pushes to channel - can be redefined depending on source
  value.set = (v) => {
    v = map(v)
    if (v && v.then) {
      delete value.current
      v.then(v => channel.next(value.current = v))
    } else {
      channel.next(value.current = v)
    }
  }

  // default get receives last set value
  value.get = () => value.current

  value.subscribe = callback => {
    channel.subscribe(callback)
    // callback is registered as the last channel subscription, so send it immediately as value
    if ('current' in value) {
      channel.next(value.get(), channel.subs.slice(-1))
    }
  }
  value.cancel = () => {
    unsubscribe()
    channel.cancel()
    delete value.current
  }

  value.valueOf = value.toString = value[Symbol.toPrimitive] = value.get

  // detect source
  let unsubscribe
  if (arguments.length) {
    // group
    if (Array.isArray(init)) {
      let vals = value.current = []
      const depc = c()
      const deps = init.map((dep, i) => {
        let depv = v(dep)
        depv(v => (vals[i] = v, depc(vals)))
        return depv
      })
      depc(value.set)
      if (vals.length || !init.length) depc(vals)
      unsubscribe = () => (deps.map(depv => depv.cancel()), depc.cancel())
    }
    // constant (stateful)
    else if (primitive(init)) {
      value.set(init)
    }
    // observ
    else if (typeof init === 'function') {
      delete value.current
      let block = false
      const uninit = init(v => (!block && value.set(v)))
      const unself = value.subscribe(v => (block = true, init(v), block = false))
      unsubscribe = () => (uninit(), unself())
    }
    // input
    else if (init.nodeType) {
      const el = init

      const get = value.get = el.type === 'checkbox' ? () => el.checked : () => el.value

      const set = {
        text: value => el.value = (value == null ? '' : value),
        checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
        'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
      }[el.type]

      const _set = value.set
      value.set = v => {
        if (v !== value.current) (set(v), _set(get()))
      }

      const update = e => value.set(get())

      // normalize initial value
      update()

      el.addEventListener('change', update)
      el.addEventListener('input', update)

      unsubscribe = () => (
        value.set = v=>v,
        el.removeEventListener('change', update),
        el.removeEventListener('input', update)
      )
    }
    // Observable (stateless)
    else if (init[_observable]) {
      delete value.current
      unsubscribe = init[_observable]().subscribe({next: value.set})
      unsubscribe = unsubscribe.unsubscribe || unsubscribe
    }
    // async iterator (stateful, initial undefined)
    else if (init.next || init[Symbol.asyncIterator]) {
      delete value.current
      let stop
      ;(async () => {
        for await (let v of init) {
          if (stop) break
          value.set(v)
        }
      })()
      unsubscribe = () => stop = true
    }
    // promise (stateful, initial undefined)
    else if (init.then) {
      delete value.current
      init.then(value.set)
    }
    // plain value
    else {
      value.set(init)
    }
  }

  return value
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (primitive(arg)) return false
  return !!(typeof arg === 'function' || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then)
}

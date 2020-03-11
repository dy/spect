import _observable from 'symbol-observable'
import c, { observer } from './channel.js'


export default function v(init, map = v => v) {
  const channel = c()

  const value = Object.assign((...args) => (
      !args.length ? (value.get && value.get()) :
      observer(...args) ? value.subscribe(...args) :
      (value.set && value.set(...args))
    ), channel)

  value.next = arg => channel.next(value.current = map(arg))

  value.get = () => value.current

  // manual set, handles subscription to input obsevrable
  let unsub
  value.set = arg => {
    // unsubscribe prev, if any
    if (unsub && unsub.call) (unsub(), unsub = null)

    // group
    if (Array.isArray(arg)) {
      const vals = value.current = []
      const channel = c()
      const deps = arg.map((dep, i) => {
        let depv = v(dep)
        depv(v => (vals[i] = v, channel(vals)))
        return depv
      })
      channel(value.next)
      if (vals.length) channel(vals)
      unsub = () => (deps.map(depv => depv.cancel()), channel.cancel())
    }
    // constant (stateful)
    else if (primitive(arg)) {
      value.next(arg)
    }
    // observ
    else if (typeof arg === 'function') {
      delete value.current
      unsub = arg(value.next)
    }
    // Observable (stateless)
    else if (arg[_observable]) {
      delete value.current
      unsub = arg[_observable]().subscribe({next: value.next})
      unsub = unsub.unsubscribe || unsub
    }
    // async iterator (stateful, initial undefined)
    else if (arg.next || arg[Symbol.asyncIterator]) {
      delete value.current
      let stop
      ;(async () => {
        for await (let v of arg) {
          if (stop) break
          value.next(v)
        }
      })()
      unsub = () => stop = true
    }
    // promise (stateful, initial undefined)
    else if (arg.then) {
      delete value.current
      arg.then(value.next)
    }
    // plain value
    else {
      value.next(arg)
    }
  }

  value.subscribe = callback => {
    channel.subscribe(callback)
    // callback is registered as the last channel subscription, so send it immediately as value
    if ('current' in value) {
      channel.next(value.get(), channel.subs.slice(-1))
    }
  }
  value.cancel = () => {
    channel.cancel()
    delete value.current
  }

  value.valueOf = value.toString = value[Symbol.toPrimitive] = value.get

  // detect source
  if (arguments.length) value.set(init)

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

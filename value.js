import channel, { observer, CANCEL } from './channel.js'

export default (...subs) => {
  let cur = subs.length ? [subs.shift()] : []

  const value = Object.assign((...args) => {
      if (!cur) return CANCEL
      if (args[0] === CANCEL) return value.cancel(cur = CANCEL)
      return !args.length ? (value.get && value.get()) :
        observer(...args) ? value.subscribe(...args) :
        (value.set && value.set(...args))
    }, {
    ...channel(),
    get: () => cur[0],
    set: val => value.next(cur[0] = val)
  })

  const subscribe = value.subscribe
  value.subscribe = val => (val = val.next || val, cur.length && val(value.get && value.get()), subscribe(val))

  return value
}


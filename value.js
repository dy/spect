import channel, { observer } from './channel.js'

export default (...subs) => {
  let cur = subs.length ? [subs.shift()] : []

  const value = Object.assign((...args) => {
      return !args.length ? (value.get && value.get()) :
        observer(...args) ? value.subscribe(...args) :
        (value.set && value.set(...args))
    }, {
    ...channel(),
    get: () => cur[0],
    set: val => value.next(cur[0] = val)
  })

  const {subscribe, cancel} = value
  value.subscribe = val => (val = val.next || val, cur.length && val(value.get && value.get()), subscribe(val))
  value.cancel = () => (cancel(), cur = null)

  return value
}


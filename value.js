import channel, { observer } from './channel.js'

export default (...subs) => {
  const value = Object.assign((...args) => {
      return !args.length ? (value.get && value.get()) :
        observer(...args) ? value.subscribe(...args) :
        (value.set && value.set(...args))
    }, {
    ...channel(),
    set: val => (value.get = value.get || (() => value.current), value.next(value.current = val))
  })

  if (subs.length) value.set(subs.shift())

  const {subscribe, cancel} = value
  value.subscribe = val => (val = val.next || val, value.get && val(value.get()), subscribe(val))
  value.cancel = () => (cancel(), delete value.current)

  return value
}


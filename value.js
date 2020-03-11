import channel, { observer } from './channel.js'

export default (...subs) => {
  const value = Object.assign((...args) => (
      !args.length ? (value.get && value.get()) :
        observer(...args) ? value.subscribe(...args) :
        (value.set && value.set(...args))
    ), {
    ...channel(),
    get: () => value.current,
    set: val => (value.next(value.current = val))
  })

  if (subs.length) value.current = subs.shift()

  const {subscribe, cancel} = value
  value.subscribe = val => (val = val.call ? val : val.next, 'current' in value && val(value.get()), subscribe(val))
  value.cancel = () => (cancel(), delete value.current)

  return value
}


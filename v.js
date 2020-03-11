import c, { observer } from './channel.js'

export default function v(init, map) {
  const channel = c()

  const value = Object.assign((...args) => (
      !args.length ? (value.get && value.get()) :
        observer(...args) ? value.subscribe(...args) :
        (value.set && value.set(...args))
    ), {
    ...channel,
    get: () => value.current,
    set: val => (value.next(value.current = val))
  })

  if (arguments.length) value.current = init

  value.subscribe = val => (val = val.call ? val : val.next, channel.subscribe(val), 'current' in value && channel.next(value.get()))
  value.cancel = () => (channel.cancel(), delete value.current)

  return value
}

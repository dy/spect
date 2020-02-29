import bus from './src/bus.js'

// Observable with notifications only about changed values
export default function state (value) {
  const channel = bus(
    () => value,
    newValue => newValue === value ? false : (value = newValue, true)
  )
  if (arguments.length) channel(value)
  return channel
}

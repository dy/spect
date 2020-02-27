import bus from './src/bus.js'

// Observable with notifications only about changed values
export default function state (value) {
  const state = bus(
    () => value,
    newValue => newValue === value ? false : (value = newValue, true)
  )

  return state
}

import bus from './src/bus.js'

// Observable with notifications only about changed values
export default function state (value) {
  let current = value

  const state = bus(
    () => current,
    value => current === value ? false : (current = value, true)
  )

  return state
}

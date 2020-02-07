import ref from './ref.js'

// Observable with notifications only about changed values
export default function state (value) {
  const state = ref(typeof value === 'function' ? value() : value)

  const set = state.set
  state.set = (value) => {
    let current = state.get()
    value = typeof value === 'function' ? value(current) : value
    if (value === current) return current
    return set(value)
  }

  return state
}

import ref from './ref.js'

// Observable with notifications only about changed values
export default function state (value) {
  const state = ref(value)

  const set = state.set
  state.set = (value) => {
    let current = state.get()
    if (value === current) return current
    return set(value)
  }

  return state
}

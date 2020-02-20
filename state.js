import ref from './src/ref.js'
import { getval } from './src/util.js'

// Observable with notifications only about changed values
export default function state (value) {
  const state = ref(getval(value))

  const set = state.set
  state.set = (value) => {
    let current = state.get()
    value = getval(value, current)
    if (value === current) return current
    return set(value)
  }

  return state
}

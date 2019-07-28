// provides state per target-aspect
import { currentState, update } from './spect'

// whenever we set state, we should plan rerendering
export default function state (val) {
  if (!currentState.state) {
    currentState.state = {}
  }

  if (val) {
    Object.assign(currentState.state, val)
    currentState.dirty = true
  }

  return currentState.state
}

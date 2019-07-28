// provides state per target-aspect
import { currentState } from './spect'

// whenever we set state, we should plan rerendering
export default function state (values) {
  if (!currentState.state) {
    currentState.state = new Proxy({}, {
      set: (props, prop, value) => {
        if (props[prop] === value) return true

        props[prop] = value
        currentState.dirty = true

        return true
      }
    })
  }

  if (values) Object.assign(currentState.state, values)

  return currentState.state
}

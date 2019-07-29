// useEffect
import equal from 'fast-deep-equal'
import * as stack from 'stacktrace-parser'
import { currentState } from './spect'

// whenever we set state, we should plan rerendering
export default function fx(fn, deps) {
  let e = new Error()
  console.log(stack.parse(e.stack))
}

// useEffect
import equal from 'fast-deep-equal'
import * as stack from 'stacktrace-parser'
import { currentState } from './spect.js'
import { isAsync } from './util.js'
import { current } from 'tst';

const fxCache = {}

// planning fx, opposed to immediate call, is useful to obtain refs to variables declared after the effect (even to rendered html)
export default function fx(fn, deps) {
  // create fx cache per state
  if (!currentState.fx) {
    currentState.prevFx = []
    currentState.fx = []

    currentState.before.push(() => {
      currentState.prevFx = currentState.fx || []
      currentState.fx = []
    })

    currentState.after.push(() => {
      let prev = currentState.prevFx, curr = currentState.fx
      prev.forEach(({id}) => {
        // destroy skipped effects
        if (!curr[id]) prev[id].destroy()
      })
      // run new effects
      curr = curr.map(fn => fn())
      currentState.prevFx = null
    })
  }

  // identify effect by position of `fx` in callstack
  // FIXME: that can be useful outside of here as well
  // FIXME: possibly faster to cache by effect id and calc stack in after-call
  // FIXME: these stacktrace calcs can be done statically
  let [fxCallsite, ...trace] = stack.parse((new Error).stack)
  if (fxCallsite.methodName !== 'fx') throw Error('Wrong callsite of `fx`')
  let fxId = fxCallsite.lineNumber + '-' + fxCallsite.column

  if (!currentState.prevFx[fxId] || !equal(currentState.prevFx[fxId].deps, deps)) {
    currentState.fx.push(fn)
    currentState.fx[fxId] = fn
  }
}

export function asyncFx(id, fn, deps) {
  let e = new Error()
  console.log(stack.parse(e.stack))
}

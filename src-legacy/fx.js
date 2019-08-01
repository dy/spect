// useEffect
import equal from 'fast-deep-equal'
import * as stack from 'stacktrace-parser'
import { currentState } from './spect.js'
import { isAsync, noop } from './util.js'
import { current } from 'tst';

const asyncFx = {}

// planning fx, opposed to immediate call, is useful to obtain refs to variables declared after the effect (even to rendered html)
export default function fx(fn, deps) {
  // create fx cache per state
  if (!currentState.fx) {
    let state = currentState
    state.prevFx = []
    state.fx = []

    state.onBefore.push(() => {
      state.prevFx = state.fx || []
      state.fx = []
    })

    state.onAfter.push(() => {
      let prev = state.prevFx, curr = state.fx
      prev.forEach(fn => {
        // destroy abandoned effects
        if (!curr[fn.id] || fn.delete) {
          fn.destroy()
        }
      })
      // run new effects
      curr.forEach(fn => {
        // if (isAsync(fn)) asyncFx[fn.id] =
        if (fn.update) {
          fn.destroy = fn() || noop
        }
      })
      state.prevFx = null
    })

    state.onDestroy.push(() => {
      state.fx.forEach(fn => fn.destroy())
      state.fx = null
    })
  }

  // identify effect by position of `fx` in callstack
  // FIXME: that can be useful outside of here as well
  // FIXME: possibly faster to cache by effect id and calc stack in after-call
  // FIXME: these stacktrace calcs can be done statically
  let [, callsite, ...trace] = stack.parse((new Error).stack)
  let fxId = callsite.lineNumber + '-' + callsite.column

  fn.id = fxId
  fn.deps = deps
  currentState.fx.push(fn)
  currentState.fx[fxId] = fn

  if (currentState.prevFx[fxId]) {
    // destroy changed effect
    if (deps === undefined || !equal(currentState.prevFx[fxId].deps, deps)) {
      currentState.prevFx[fxId].delete = true
      fn.update = true
    }
    else {
      fn.destroy = currentState.prevFx[fxId].destroy
    }
  }
  else {
    fn.update = true
  }
}

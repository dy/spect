import t from 'immutable-tuple'
import Events from 'nanoevents'
import { isAsync, noop } from './util.js'

// TODO: invalidate html vdom for elements that're being changed by something outside of spect scope

export const SPECT_CLASS = '👁'// + Math.random().toString(36).slice(2)

// states for target-fx tuples
export const tracking = new WeakMap()

// fxs for targets
export const targets = new WeakMap()

export let rootTarget = document.documentElement
export let currentTarget = rootTarget
export let currentFx = null // FIXME: logically document.currentScript context

// returned function is destroy effect
export const spect = function spect (selector, fx) {
  let that = this || currentTarget

  if (typeof selector === 'string') {
    let targets = that.querySelectorAll(selector)
    targets.forEach(target => spect(target, fx))
    return targets
  }

  // existing targets won't be reinitialized
  if (tracking.has(t(selector, fx))) return

  // direct element ensures parent, appends child and calls fx
  let destroy = callFx(selector, fx)
  tracking.get(t(selector, fx)).destroy = destroy

  // register generic known targets
  if (!targets.has(selector)) {
    selector.classList.add(SPECT_CLASS)
    targets.set(selector, new Set)
  }
  targets.get(selector).add(fx)

  return selector
}

export const destroy = spect.destroy = function destroy (target, fx) {
  let that = this === spect ? currentTarget : this || currentTarget

  if (typeof target === 'string') {
    let targets = that.querySelectorAll(target)
    targets.forEach(target => destroy(target, fx))
    return targets
  }

  if (!targets.has(target)) return target

  target.classList.remove(SPECT_CLASS)

  if (fx) {
    destroyState(t(target, fx))
    targets.get(target).delete(fx)
    if (!targets.get(target).size) targets.delete(target)
    return target
  }

  let fxs = targets.get(target)
  for (let fx of fxs) {
    destroyState(t(target, fx))
  }
  fxs.clear()
  targets.delete(target)

  return target
}

export function callFx(target, fx = noop) {
  let tuple = t(target, fx)

  // register current target in parent aspect children list
  let currentTuple = t(currentTarget, currentFx)
  if (!tracking.has(currentTuple)) tracking.set(currentTuple, createState(currentTuple))
  let parentState = tracking.get(currentTuple)
  if (!parentState.children.has(tuple)) parentState.children.add(tuple)

  parentState.emit('before')

  // reset child fx count
  if (!tracking.has(tuple)) tracking.set(tuple, createState(tuple))
  let state = tracking.get(tuple)
  let prevChildren = state.children
  let newChildren = state.children = new Set

  // call tracking the stack
  let prevTarget = currentTarget
  let prevFx = currentFx
  currentTarget = target
  currentFx = fx
  let result = fx.call(currentTarget, target) || noop
  currentFx = prevFx
  currentTarget = prevTarget

  parentState.emit('after')

  // check if some old children need disposal
  for (let tuple of prevChildren) if (!newChildren.has(tuple)) tracking.get(tuple).dispose()

  return result
}



function createState(tuple) {
  let emitter = new Events
  let off = []

  let state = {
    // assigned as result of callFx
    destroy: null,

    // list of registered children target-fx couples
    children: new Set,

    // events
    emit: (evt, arg) => (emitter.emit(evt, arg), state),
    off: () => off = off.forEach(off => off()),
    on: (evt, fn) => off.push(emitter.on(evt, fn))
  }
  return state.emit('create')
}

function destroyState(tuple) {
  if (!tracking.has(tuple)) return

  let state = tracking.get(tuple)

  state.emit('destroy')

  // clean up children
  for (let tuple of state.children) destroyState(tuple)
  state.children.clear()
  delete state.children

  // unbind all registered events
  state.off()

  // invoke registered aspect destructors
  if (state.destroy) state.destroy()

  // clean up parent
  tracking.delete(tuple)
}


export default spect

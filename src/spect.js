import t from 'immutable-tuple'
import { isAsync, noop } from './util.js'

// TODO: invalidate html vdom for elements that're being changed by something outside of spect scope

export const SPECT_CLASS = '👁'// + Math.random().toString(36).slice(2)

// states for target-aspect tuples
export const tracking = new WeakMap()

// aspects for targets
export const targets = new WeakMap()

export let rootTarget = document.documentElement

// FIXME: use only currentTuple, or even just currentState instead
export let currentTarget = rootTarget
export let currentAspect = null // FIXME: logically document.currentScript context
export let currentTuple = t(currentTarget, currentAspect)
export let currentState = createState(currentTuple)
tracking.set(currentTuple, currentState)

// returned function is destroy effect
export const spect = function spect (selector, aspect) {
  let that = this || currentTarget

  if (typeof selector === 'string') {
    let targets = that.querySelectorAll(selector)
    targets.forEach(target => spect(target, aspect))
    return targets
  }

  // existing targets won't be reinitialized
  if (tracking.has(t(selector, aspect))) return

  // direct element ensures parent, appends child and calls aspect
  let destroy = callAspect(selector, aspect)
  tracking.get(t(selector, aspect)).destroy = destroy

  // register generic known targets
  if (!targets.has(selector)) {
    selector.classList.add(SPECT_CLASS)
    targets.set(selector, new Set)
  }
  targets.get(selector).add(aspect)

  return selector
}

export const destroy = spect.destroy = function destroy (target, aspect) {
  let that = this === spect ? currentTarget : this || currentTarget

  if (typeof target === 'string') {
    let targets = that.querySelectorAll(target)
    targets.forEach(target => destroy(target, aspect))
    return targets
  }

  if (!targets.has(target)) return target

  target.classList.remove(SPECT_CLASS)

  if (aspect) {
    destroyState(t(target, aspect))
    targets.get(target).delete(aspect)
    if (!targets.get(target).size) targets.delete(target)
    return target
  }

  let aspects = targets.get(target)
  for (let aspect of aspects) {
    destroyState(t(target, aspect))
  }
  aspects.clear()
  targets.delete(target)

  return target
}


export function callAspect(target, aspect = noop) {
  let parentTarget = currentTarget
  let parentAspect = currentAspect
  let parentTuple = currentTuple
  let parentState = currentState
  currentTarget = target
  currentAspect = aspect
  currentTuple = t(target, aspect)
  if (!tracking.has(currentTuple)) tracking.set(currentTuple, createState(currentTuple))
  currentState = tracking.get(currentTuple)

  // register current target in parent aspect children list
  if (!parentState.children.has(currentTuple)) parentState.children.add(currentTuple)

  currentState.before.forEach(fn => fn())

  // reset child aspect count
  let prevChildren = currentState.children
  let newChildren = currentState.children = new Set

  let result = aspect.call(currentTarget, currentTarget) || noop

  // check if old children aren't being called in new aspect call and dispose them
  for (let tuple of prevChildren) if (!newChildren.has(tuple)) tracking.get(tuple).dispose()

  currentState.after.forEach(fn => fn())

  currentAspect = parentAspect
  currentTarget = parentTarget
  currentTuple = parentTuple
  currentState = parentState

  return result
}


function createState(tuple) {
  let state = {
    // assigned as result of callAspect
    destroy: null,

    // list of registered children target-aspect couples
    children: new Set,

    // hooks
    before: [],
    after: []
  }

  return state
}

function destroyState(tuple) {
  if (!tracking.has(tuple)) return

  let state = tracking.get(tuple)

  // clean up children
  for (let tuple of state.children) destroyState(tuple)
  state.children.clear()
  delete state.children

  // unbind all registered hooks
  state.before.length = 0
  state.after.length = 0

  // invoke registered aspect destructors
  if (state.destroy) state.destroy()

  // clean up parent
  tracking.delete(tuple)
}


export default spect

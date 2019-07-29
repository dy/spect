import t from 'immutable-tuple'
import { isAsync, noop } from './util.js'

// TODO: invalidate html vdom for elements that're being changed by something outside of spect scope

export const SPECT_CLASS = '👁'// + Math.random().toString(36).slice(2)
export const MAX_DEPTH = 50

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

// attach aspect to selector
export const spect = function spect (target, aspect) {
  let that = this || currentTarget

  if (typeof target === 'string') {
    let targets = that.querySelectorAll(target)
    targets.forEach(target => spect(target, aspect))
    return targets
  }
  if (Array.isArray(target) || target instanceof NodeList) {
    target.forEach(target => spect(target, aspect))
    return target
  }

  let tuple = t(target, aspect)

  // existing targets won't be reinitialized
  if (tracking.has(tuple)) return target

  if (!targets.has(target)) {
    targets.set(target, new Set)
  }
  targets.get(target).add(aspect)
  tracking.set(tuple, createState(tuple))

  target.classList.add(SPECT_CLASS)

  update(target, aspect)

  return target
}

// just rerender aspect without checks
export const update = spect.update = function update(target, aspect) {
  let that = this === spect ? currentTarget : this || currentTarget

  if (typeof target === 'string') {
    let targets = that.querySelectorAll(target)
    targets.forEach(target => update(target, aspect))
    return targets
  }
  if (Array.isArray(target) || target instanceof NodeList) {
    target.forEach(target => update(target, aspect))
    return target
  }

  // ignore unregistered targets
  if (!targets.has(target)) return target

  // returned function is destroy effect\
  callAspect(target, aspect)

  target.classList.add(SPECT_CLASS)

  return target
}

export const destroy = spect.destroy = function destroy (target, aspect) {
  let that = this === spect ? currentTarget : this || currentTarget

  if (typeof target === 'string') {
    let targets = that.querySelectorAll(target)
    targets.forEach(target => destroy(target, aspect))
    return targets
  }
  if (Array.isArray(target) || target instanceof NodeList) {
    target.forEach(target => destroy(target, aspect))
    return target
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


// TODO: make currentState/currentElement/currentTarget a function
// TODO: move state stack to before/after

export function callAspect(target, aspect) {
  let parentTarget = currentTarget
  let parentAspect = currentAspect
  let parentTuple = currentTuple
  let parentState = currentState
  currentTarget = target
  currentAspect = aspect
  currentTuple = t(target, aspect)
  currentState = tracking.get(currentTuple)

  // register current target in parent aspect children list
  if (!parentState.children.has(currentTuple)) parentState.children.add(currentTuple)

  // handle dirty flag for rerenders
  let count = 0
  currentState.dirty = true
  while (currentState.dirty) {
    if(++count > MAX_DEPTH) throw Error('Max depth limit reached. There\'s recursion')

    currentState.before.forEach(fn => fn())

    // reset child aspect count
    let prevChildren = currentState.children
    let newChildren = currentState.children = new Set

    currentState.dirty = false
    currentState.destroy = aspect.call(currentTarget, currentTarget) || noop

    // check if old children aren't being called in new aspect call and dispose them
    for (let tuple of prevChildren) if (!newChildren.has(tuple)) {
      destroyState(tracking.get(tuple))
    }

    currentState.after.forEach(fn => fn())
  }

  currentAspect = parentAspect
  currentTarget = parentTarget
  currentTuple = parentTuple
  currentState = parentState
}


function createState(tuple) {
  let state = {
    // assigned as result of callAspect
    destroy: null,

    // list of registered children target-aspect couples
    children: new Set,

    // hooks
    before: [],
    after: [],

    // redraw flag
    dirty: false
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

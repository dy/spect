// main aspect effect (init/render/update/run/etc.)
// triggered when aspect is attached to element or on any rerender/rerun
// destroyed when element stops matching aspect or parent element loses its aspect
import t from 'immutable-tuple'
import { currentTarget, callFx, beforeFx, SPECT_CLASS, selectors, currentFx } from './spect.js'
import { MultikeyMap, noop } from './util'

const tracking = new WeakMap()

export let currentRender = null


export default function render (target, selector, fx=noop) {
  if (selector) {
    // make sure rendered function need no disposal
    if (!target.matches(selector)) return tracking.get(t(target, fx)).dispose()

    if (!tracking.has(t(target, fx))) {
      // on attr change
      const observer = new MutationObserver((mutations) => {
        // dispose element and it's nested fxs if it doesn't match selector anymore
        if (!target.matches(selector)) tracking.get(t(target, fx)).dispose()
      })

      observer.observe(target, {
        attributes: true,
        // FIXME: add correct attribute filter matching the selector
        // attributeFilter: ['id', 'class']
      })

      // init aspect state
      tracking.set(t(target, fx), {
        children: new Set,
        dispose() {
          let state = tracking.get(t(target, fx))
          for (let [target, fx] of state.children) {
            tracking.get(t(target, fx)).dispose()
          }
          state.children.clear()
          state.destroy()
          observer.disconnect()
          tracking.delete(t(target, fx))
        }
      })
    }
  }

  // before hook
  if (beforeStack.has(target)) beforeStack.get(target).forEach(fn => fn(target))

  // register current target in parent aspect children list
  let parentState = tracking.get(t(currentTarget, currentRender))
  if (parentState) parentState.children.add(t(target, fx))

  // reset child aspects count
  let state = tracking.get(t(target, fx))
  let prevChildren = state.children
  let newChildren = state.children = new Set

  // rerender
  let prevRender = currentRender
  currentRender = fx
  state.destroy = callFx('render', fx, target) || noop
  currentRender = prevRender

  // check if some old children need disposal
  for (let [target, fx] of prevChildren) {
    if (!newChildren.has(t(target, fx))) tracking.get(t(target, fx)).dispose()
  }

  // after hook
  if (afterStack.has(target)) afterStack.get(target).forEach(fn => fn(target))
}


// render hooks
const beforeStack = new WeakMap, afterStack = new WeakMap

export function beforeRender(target, fn) {
  if (!beforeStack.has(target)) beforeStack.set(target, [])
  let beforeListeners = beforeStack.get(target)
  if (beforeListeners.indexOf(fn) < 0) beforeListeners.push(fn)
}
export function afterRender(target, fn) {
  if (!afterStack.has(target)) afterStack.set(target, [])
  let afterListeners = afterStack.get(target)
  if (afterListeners.indexOf(fn) < 0) afterListeners.push(fn)
}

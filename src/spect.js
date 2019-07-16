import t from 'immutable-tuple'
import { isAsync, noop } from './util.js'


// TODO: invalidate html vdom for elements that're being changed by something outside of spect scope

// export const SPECT_CLASS = '👁' + Math.random().toString(36).slice(2)
// const CONNECTED = 0, DISCONNECTED = 1


// stores states per target-fx tuples
const tracking = new WeakMap()

// current rendering context
export let rootTarget = document.documentElement
export let currentTarget = rootTarget
export let currentFx = null


// NOTE: aspect === init effect, that treats returned function as destroy effect


export const selectors = new WeakMap

// TODO: selectors must be attached per target per aspect; when aspect destroys, it should remove all associated selectors.
// mb just easier to store mutation observer per-target-effect, so that it would be easier to handle changes bottom-up, each level would intercept its own relevantn events

const SELECTOR_ID = 1, SELECTOR_CLASS = 2, SELECTOR_QUERY = 3, SELECTOR_ELEMENT = 4



// TODO: run already existing elements matching selector
// TODO: return dynamic resulting elements with provided fx on them


export default function spect (selector, fx) {
  // provide state for current target
  let currentTuple = t(currentTarget, fx)
  if (!tracking.has(currentTuple)) {
    tracking.set(currentTuple, {
      fxs: new Set,
      children: new Set,
      dispose() {
        let state = this
        for (let [target, fx] of state.children) {
          tracking.get(currentTuple).dispose()
        }
        state.children.clear()
        state.fxs.clear()
        delete state.children
        delete state.fxs
        if (state.observer) {
          state.observer.disconnect()
          delete state.selectors
        }
      }
    })
  }

  let state = tracking.get(currentTuple)

  // if observing is not set up for the current (parent) aspect - set it up
  if (typeof selector === 'string' && !state.observer) {
    // TODO: build an fx depending on type of fx argument?
    // TODO: observer allows multiple targets
    // TODO: unregister observer when element is unmounted
    // FIXME: make this observer lazy
    // Sole purpose observer - init listener for elements matching selector
    // init mutation observer for the target
    let observer = new MutationObserver(handleMutations)

    observer.observe(rootTarget, {
      childList: true,
      subtree: true,
      attributes: true,
      // FIXME: make observer combinatory, so that complex selectors don't register observe-all stuff. `css-what` is nice solution.
      // FIXME: add correct attribute filter matching the selector
      // attributeFilter: ['id', 'class']
    })

    state.observer = observer
    state.selectors = {}
  }

  // register selector
  let fxs = state.selectors[selector] || (state.selectors[selector] = [])
  fxs.push(fx)
  fxs.type = ((selector) => {
    if(selector instanceof Node) return SELECTOR_ELEMENT
    if (/^#[^\s] * $ /.test(selector)) return SELECTOR_ID
    if (/^\.[^\s]*$/.test(selector)) return SELECTOR_CLASS
    return SELECTOR_QUERY
  })(selector)

  // TODO: create spect.min without mutation observers
  // no-mutations initializer
  handleElements(document.querySelectorAll(selector))

  // instantly handle accumulated mutations (skips extra tick)
  handleMutations(observer.takeRecords())
}

function handleMutations (mutations) {
  for (let m = 0; m < mutations.length; m++) {
    const { addedNodes, removedNodes, target, type, attributeName, oldValue } = mutations[m]

    handleElements([target, ...addedNodes, ...removedNodes])
  }
}

function handleElements (nodes) {
  // TODO: inverse querying as `ids[node.id]`, `classes[node.class[i]]`
  // TODO: cache selectors assigned to targets and check if they're valid still
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    // ignore non-element nodes
    // FIXME: there should be a faster way to filter text nodes
    if (node.nodeType !== 1) continue

    // make sure rendered function need no disposal
    if (!node.matches(selector)) return tracking.get(t(node, fx)).dispose()

    // check if target matches any of registered selector listeners
    for (let selector in selectors) {
      let selFxs = selectors[selector]
      let selType = selFxs.type

      let targets = []

      if (selType === SELECTOR_ID) {
        let id = selector.slice(1)
        if (node.id === id) targets.push(node)
        else {
          // FIXME: use more correct root for server-side env
          const el = document.getElementById(id)
          if (node.contains(el)) targets.push(el)
        }
      }
      else if (selType === SELECTOR_QUERY) {
        if (node.matches(selector)) targets.push(node)
        targets.push(...node.querySelectorAll(selector))
      }
      else if (selType === SELECTOR_CLASS) {
        let elClass = selector.slice(1)
        if (node.classList.contains(elClass)) targets.push(node)
        targets.push(...node.getElementsByClassName(elClass))
      }

      targets = targets.filter(Boolean)

      selFxs.forEach(fx => {
        targets.forEach(target => {
          callFx(target, fx)
        })
      })
    }
  }
}


export function callFx(target, fx = noop) {
  // before hook
  if (beforeStack.has(target)) beforeStack.get(target).forEach(fn => fn(target))

  // register current target in parent aspect children list
  let parentState = tracking.get(t(currentTarget, currentFx))
  if (parentState) parentState.children.add(t(target, fx))

  // reset child fx count
  let state = tracking.get(t(target, fx))
  let prevChildren = state.children
  let newChildren = state.children = new Set

  // call tracking the stack
  let prevTarget = currentTarget
  let prevFx = currentFx
  currentTarget = target
  currentFx = fx
  let result = fx(target) || noop
  currentFx = prevFx
  currentTarget = prevTarget

  // check if some old children need disposal
  for (let [target, fx] of prevChildren) {
    if (!newChildren.has(t(target, fx))) tracking.get(t(target, fx)).dispose()
  }

  // after hook
  if (afterStack.has(target)) afterStack.get(target).forEach(fn => fn(target))

  return result
}


// render hooks
const beforeStack = new WeakMap, afterStack = new WeakMap

export function before(target, fn) {
  if (!beforeStack.has(target)) beforeStack.set(target, [])
  let beforeListeners = beforeStack.get(target)
  if (beforeListeners.indexOf(fn) < 0) beforeListeners.push(fn)
}
export function after(target, fn) {
  if (!afterStack.has(target)) afterStack.set(target, [])
  let afterListeners = afterStack.get(target)
  if (afterListeners.indexOf(fn) < 0) afterListeners.push(fn)
}

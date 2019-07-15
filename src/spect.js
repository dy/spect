import t from 'immutable-tuple'
import { isAsync, noop } from './util.js'
import render from './render.js';


// TODO: invalidate html vdom for elements that're being changed by something outside of spect scope


export const SPECT_CLASS = '👁' + Math.random().toString(36).slice(2)
// const CONNECTED = 0, DISCONNECTED = 1

// NOTE: aspect === init effect, that treats returned function as destroy effect

// selector effects
export const selectors = {}

const SELECTOR_ID = 1, SELECTOR_CLASS = 2, SELECTOR_QUERY = 3, SELECTOR_ELEMENT = 4

function getSelectorType (selector) {
  if (selector instanceof Node) return SELECTOR_ELEMENT
  if (/^#[^\s]*$/.test(selector)) return SELECTOR_ID
  if (/^\.[^\s]*$/.test(selector)) return SELECTOR_CLASS
  return SELECTOR_QUERY
}

// TODO: run already existing elements matching selector

// { selector: listener[] } map
// FIXME: make a weakmap

export default function spect (selector, fx) {
  if (selector instanceof Node) {
    let target = selector
    return render(target, null, fx)
  }

  // FIXME: make selectors an array
  let fxs = selectors[selector] || (selectors[selector] = [])
  fxs.push(fx)
  fxs.type = getSelectorType(selector)

  // TODO: create spect.min without mutation observers
  // no-mutations initializer
  handleElements(document.querySelectorAll(selector))

  // instantly handle accumulated mutations (skips extra tick)
  handleMutations(observer.takeRecords())
}


// TODO: build an listener listener?
// TODO: observer allows multiple targets
// TODO: unregister observer when element is unmounted
// FIXME: make this observer lazy
// Single purpose observer - init listener for elements matching selector
export const observer = new MutationObserver(handleMutations)

// FIXME: make observer combinatory, so that complex selectors don't register observe-all stuff. `css-what` is nice solution.
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  // FIXME: selectors should register corresponding attributeFilter
  attributeFilter: ['id', 'class']
})


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
          render(target, selector, fx)
        })
      })
    }
  }
}

// calling fx stack
export let currentTarget = document.documentElement
export let currentFx = null
export let currentFxName = null

export function callFx(name, fn, target) {
  let prevTarget
  if (target) {
    prevTarget = currentTarget
    currentTarget = target
  }

  let prevFx = currentFx
  currentFx = fn

  // TODO: use for effectFn.name
  let prevFxName = currentFxName
  currentFxName = name

  // current target passed for inline effects `$(target).fx(target => {})`
  let result = fn(currentTarget)

  currentFx = prevFx
  currentFxName = prevFxName
  if (target) currentTarget = prevTarget

  return result
}


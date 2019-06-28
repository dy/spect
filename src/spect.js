import { isAsync } from './util.js'

// const SPECT_CLASS = '👁' //+ Math.random().toString(36).slice(2)
// const CONNECTED = 0, DISCONNECTED = 1

export const selectors = {}

// tracked real elements
export const tracking = new WeakMap()


const SELECTOR_ID = 1, SELECTOR_CLASS = 2, SELECTOR_QUERY = 3, SELECTOR_ELEMENT = 4

function getSelectorType (selector) {
  if (selector instanceof Node) return SELECTOR_ELEMENT
  if (/^#[^\s]*$/.test(selector)) return SELECTOR_ID
  if (/^\.[^\s]*$/.test(selector)) return SELECTOR_CLASS
  return SELECTOR_QUERY
}

// TODO: run already existing elements matching selector

// { selector: aspect[] } map
// FIXME: make a weakmap

export default function spect (selector, aspect) {
  // FIXME: make selectors an array
  let selectorState = selectors[selector] || (selectors[selector] = {type: getSelectorType(selector), aspects: []})
  selectorState.aspects.push(aspect)

  // TODO: create spect.min without mutation observers
  // no-mutations initializer
  handleElements(document.querySelectorAll(selector))

  // instantly handle accumulated mutations (skips extra tick)
  handleMutations(observer.takeRecords())
}


// TODO: build an aspect handler?
// TODO: observer allows multiple targets
// TODO: unregister observer when element is unmounted
// FIXME: make this observer lazy
// Single purpose observer - init aspect for elements matching selector
export const observer = new MutationObserver(handleMutations)

// FIXME: make observer combinatory, so that complex selectors don't register observe-all stuff. `css-what` is nice solution.
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['id', 'class']
})


function handleMutations (mutations) {
  for (let m = 0; m < mutations.length; m++) {
    const { addedNodes, removedNodes, target, type, attributeName, oldValue } = mutations[m]

    handleElements([...addedNodes, ...removedNodes, target])
  }
}

function handleElements (nodes) {
  // TODO: inverse querying as `ids[node.id]`, `classes[node.class[i]]`
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i]

    for (let selector in selectors) {
      let {type, aspects: selectorAspects} = selectors[selector]

      let targets = []

      if (type === SELECTOR_ID) {
        let id = selector.slice(1)
        if (node.id === id) targets.push(node)
        else {
          // FIXME: use more correct root for server-side env
          const el = document.getElementById(id)
          if (node.contains(el)) targets.push(el)
        }
      }
      else if (type === SELECTOR_QUERY) {
        if (node.matches(selector)) targets.push(node)
        targets.push(...node.querySelectorAll(selector))
      }
      else if (type === SELECTOR_CLASS) {
        let elClass = selector.slice(1)
        if (node.classList.contains(elClass)) targets.push(node)
        targets.push(...node.getElementsByClassName(elClass))
      }

      targets.filter(Boolean).forEach(target => {
        // init state for unknown targets
        if (!tracking.has(target)) {
          tracking.set(target, { aspects: [] })
        }

        // if target has no registered aspect - init-run it
        let targetAspects = tracking.get(target)

        selectorAspects.forEach(aspect => {
          // init run, if aspect is not registered
          if (!~targetAspects.findIndex(a => a === aspect)) {
            targetAspects.push(aspect)

            // create effects order for aspect
            aspectFxCache.set(aspect, [])

            // FIXME: figure out what to do with result
            let result = callAspect(target, aspect, targetAspects)
          }
        })

      })
    }
  }
}


// call aspect with corresponding state, track fx count
export const callStack = []

export function callAspect(target, aspect) {
  // FIXME: async aspects - should registered effects trigger before the aspect is resolved or better wait it's finished?

  // called next tick, effects are enqueued here
  let whenEnd = Promise.resolve()
  function after(fn) { whenEnd.then(fn) }

  callStack.push([target, aspect, 0, after])

  // FIXME: what should we do with result?
  let result = aspect(target)

  // FIXME: should we pop stack before the effects run?
  // FIXME: should we pop stack before the async effect end?
  callStack.pop()

  return result
}


// cache of registered global effects
export const effects = {}

// registered effects per aspect, in order, as <aspect: { index: effect }>
export const effectStacks = new WeakMap()

export function registerEffect (name, fx) {
  if (effects[name]) throw Error('Effect already exists')

  effects[name] = function effect (...args) => {
    let callSite = callStack[callStack.length - 1]
    let [target, aspect, index, after] = callSite

    let effectStack = effectStacks.get(aspect)
    if (!effectStack[index]) {
      effectStack[index] = [fx, args]
    }
    else {
      effectSite = effectStack[index]
    }

    // the effect provider
    fx({target, aspect, index, after, initArgs: args}, args)

    callSite.index += 1
  }
}

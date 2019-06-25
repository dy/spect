// const SPECT_CLASS = '👁' //+ Math.random().toString(36).slice(2)
// const CONNECTED = 0, DISCONNECTED = 1


export const selectors = {}
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
        let state = tracking.get(target)
        let { aspects } = state

        // init run, if aspect is not registered
        if (!~aspects.findIndex(a => a === aspect)) {
          aspects.push(aspect)

          // FIXME: figure out what to do with result
          let result = callAspect(target, aspect, state)
        }
      })
    }
  }
}


// call aspect with corresponding targetStates
export const callStack = []

export function callAspect(target, aspect, state) {
  callStack.push([target, state])

  let result = aspect(target)

  // TODO: figure out if that should be called after each individual aspect and not in a separate tick or somewhere
  runEffects()

  callStack.pop()

  return result
}

// plan side-effect to call after the current aspect
export function effect(fn, args=[]) {
  effectStack.push([fn, args])
}

// accumulated side-effects for an aspect
export const effectStack = []
export function runEffects() {
  while (effectStack.length) {
    let [fx, args] = effectStack.shift()
    fx(...args)
  }
}

import { callAspect, targetStates } from '../../index.js'


export function test(target) {
  // TODO: cache target/type detection in weakmap
  if (typeof target === 'string') {
    const selector = target.trim()

    // TODO: better detection of simple selectors
    // TODO: put into type detector
    // let type = TYPE_TAG
    // spect('#id', ...)
    if (selector[0] === '#') return true
    // spect('.class', ...)

    if (selector[0] === '.') return true

    // spect(':root complex > selector')
    // if (/[\[\:\s\+\~\>]/.test(selector)) {
    //   type = TYPE_QUERY
    // }

    // if not class/id selector - that is hyperscript component
    // spect('div', ...)

    // TODO: run already existing elements matching selector
  }
}


// FIXME: how to hydrate spect elements, if classnames are random
// const SPECT_CLASS = '👁' //+ Math.random().toString(36).slice(2)
// const CONNECTED = 0, DISCONNECTED = 1


// selector target
const TYPE_ID = 'id', TYPE_CLASS = 'class', TYPE_QUERY = 'query', TYPE_TAG = 'h'

function getSelectorType (selector) {
  // TODO: better detection of simple selectors
  // TODO: put into type detector
  // let type = TYPE_TAG

  // spect('#id', ...)
  if (selector[0] === '#') return TYPE_ID
  // spect('.class', ...)

  if (selector[0] === '.') return TYPE_CLASS

  // spect(':root complex > selector')
  // if (/[\[\:\s\+\~\>]/.test(selector)) return TYPE_QUERY
  return TYPE_QUERY

  // if not class/id selector - that is hyperscript component
  // spect('div', ...)

  // TODO: run already existing elements matching selector (not as simple)
}

// { selector: aspect[] } map
// FIXME: make a weakmap
export const selectors = {}

export function spect (selector, aspect) {
  let selectorAspects = selectors[selector] || (selectors[selector] = [])
  selectorAspects.push({type: getSelectorType(selector), aspect})
}



// TODO: build an aspect handler?
// TODO: observer allows multiple targets
// TODO: unregister observer when element is unmounted


// FIXME: make this observer lazy
// Single purpose observer - init aspect for elements matching selector
export const observer = new MutationObserver(handleMutations)
observer.observe(document.documentElement, {
  childList: true,
  subtree: true
})

function handleMutations (mutations) {
  for (let m = 0; m < mutations.length; m++) {
    const { addedNodes, removedNodes, target, type, attributeName, oldValue } = mutations[m]

    // TODO: inverse querying as `ids[node.id]`, `classes[node.class[i]]`
    for (let i = 0; i < addedNodes.length; i++) {
      let node = addedNodes[i]

      for (let selector in selectors) {
        let selectorAspects = selectors[selector]
        selectorAspects.forEach(({type, aspect}) => {
          let targets = []

          if (type === TYPE_ID) {
            let id = selector.slice(1)
            if (node.id === id) targets.push(node)
            else {
              const el = document.getElementById(id)
              if (node.contains(el)) targets.push(el)
            }
          }
          else if (type === TYPE_QUERY) {
            if (node.matches(selector)) targets.push(node)
            targets.push(...node.querySelectorAll(selector))
          }
          else if (type === TYPE_CLASS) {
            let elClass = selector.slice(1)
            if (node.classList.contains(elClass)) targets.push(node)
            targets.push(...node.getElementsByClassName(elClass))
          }

          targets.filter(Boolean).forEach(target => {
            // init state for unknown targets
            if (!targetStates.has(target)) {
              targetStates.set(target, {
                aspects: []
              })
            }

            // if target has no registered aspect - init run it
            let { aspects, ...state } = targetStates.get(target)

            // init run, if aspect is not registered
            if (!~aspects.indexOf(aspect)) {
              let aspectState = { aspect }
              aspects.push(aspectState)

              // FIXME: figure out what to do with result
              let result = callAspect(target, aspectState)
            }
          })
        })
      }
    }
  }
}



export default {spect, test}

// Everything related to selector observer resides here

// TODO: extend state with
// selector indicator associated with target-fx (if created by selector)
// selector: null,

// // { target: [...fx] } - list of registered internal targets with aspects on them
// observer: null,
// observable: null,

// // clean up selectors
// // FIXME: possibly collaborate with selectors logic
// if (state.observer) {
//   state.observer.disconnect()
//   state.observable.clear()
//   delete state.observable
//   delete state.observer
// }


// TODO: selectors must be attached per target per aspect; when aspect destroys, it should remove all associated selectors.
// mb just easier to store mutation observer per-target-effect, so that it would be easier to handle changes bottom-up, each level would intercept its own relevantn events
// TODO: return dynamic resulting elements with provided fx on them


const SELECTOR_ID = 1, SELECTOR_CLASS = 2, SELECTOR_QUERY = 3, SELECTOR_ELEMENT = 4



// creates selector for current target
export function registerSelector(selector, fx) {
  let currentTuple = t(currentTarget, currentFx)

  if (!tracking.has(currentTuple)) tracking.set(currentTuple, createState(currentTuple))
  let state = tracking.get(currentTuple)

  // if observing is not set up for the current (parent) aspect - set it up
  // FIXME: mb add `live` option to register observer?
  if (!state.observer) {
    // TODO: build an fx depending on type of fx argument?
    // TODO: observer allows multiple targets
    // TODO: unregister observer when element is unmounted
    // FIXME: make this observer lazy
    state.selectors = {}
    state.observable = new WeakMap
    state.observer = new MutationObserver(mutations => handleMutations(mutations))

    // because $ selector is context-free, we observe document
    observer.observe(rootTarget, {
      childList: true,
      subtree: true,
      // attributes: true,
    })
    // observer.observe(currentTarget, )
  }

  function handleMutations(mutations) {
    for (let m = 0; m < mutations.length; m++) {
      const { addedNodes, removedNodes, target } = mutations[m]

      // TODO: create document fragment out of added nodes and query each possible registered selector
      // added nodes need them or their children to be checked against matching new selectors ( new )
      for (let sel in state.selectors) {
        let fxs = state.selectors[sel]
        // FIXME: possibly some nodes may modify the contents of the other nodes, watch out
        query(sel, addedNodes).forEach(node => {
          fxs.forEach(fx => {
            spect(target, fx)
            if (!state.observable.has(target)) state.observable.set(target, new Set)
            state.observable.set(target)
          })
        })
      }
      addedNodes.forEach(node => {
      })

      // TODO: register selectors per-target
      // FIXME: add attributive observer only on selector-created targets
      // if (target) {
      //   // make sure attr changed still node matches selector
      //   if (state.observable.has(target)) {
      //     state.observable.get(target).forEach(fx => {
      //       let state =
      //     })
      //     if (!target.matches(state.selector)) state.dispose()
      //   }
      //   // check if attr changed node matches new selectors
      //   for (let [[selector, fx], query] of selectors) {
      //     if (target.matches(selector)) spect(target, fx)
      //   }
      // }

      // removed nodes are disposed if they were attached via selectors (unlike direct elements)
      removedNodes.forEach(node => {
        if (node.classList.has(SPECT_CLASS)) removeFx(node)
        node.querySelectorAll(SPECT_CLASS).forEach(removeFx)
      })
      function removeFx(node) {
        if (!state.observable.has(node)) return
        let fxs = state.observable.get(node)
        for (let fx of fxs) tracking.get(t(node, fx)).dispose()
        fxs.clear()
        state.observable.delete(node)
      }

      handleElements([target, ...addedNodes, ...removedNodes])
    }
  }

  function handleElement(node) {
    // TODO: inverse querying as `ids[node.id]`, `classes[node.class[i]]`
    // TODO: cache selectors assigned to targets and check if they're valid still

    // ignore non-element nodes
    // FIXME: there should be a faster way to filter text nodes
    if (node.nodeType !== 1) continue

    // make sure rendered function need no disposal
    if (!node.matches(selector)) return tracking.get(t(node, fx)).dispose()

    // check if target matches any of registered selector listeners
    for (let [[selector, fx], query] in selectors) {
      let targets = []

      let targets = query(node, selector)

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

  // register selector
  if (!state.selectors[selector]) state.selectors[selector] = new Set()

  // register fx
  if (!state.selectors[selector].has(fx)) {
    state.selectors[selector].add(fx)
    // TODO: normalize synonymous selectors
    // TODO: ↓
    //     type: getSelectorType(selector),
    //     query: createQuery()
  }

  // TODO: spect.min without mutation observers
  // TODO: no-mutations initializer
  // handleElements(document.querySelectorAll(selector))
  // handleMutations(selector, observer.takeRecords())
}

// detect selector type
function getSelectorType(selector) {
  if (selector instanceof Node) return SELECTOR_ELEMENT
  if (/^#[^\s] * $ /.test(selector)) return SELECTOR_ID
  if (/^\.[^\s]*$/.test(selector)) return SELECTOR_CLASS
  return SELECTOR_QUERY
}

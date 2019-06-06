// Observing code is borrowed from https://github.com/hyperdivision/fast-on-load

const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)

// FIXME: how to hydrate spect elements, if classnames are random
const SPECT_CLASS = '👁' //+ Math.random().toString(36).slice(2)
const CONNECTED = 0, DISCONNECTED = 1
const TYPE_ID = 'id', TYPE_CLASS = 'class', TYPE_QUERY = 'query', TYPE_TAG = 'h'

const classTargets = [SPECT_CLASS]
const idTargets = []
const queryTargets = []

const tracking = new WeakMap()

// FIXME: make this observer lazy
const observer = new MutationObserver(mutations => {
  for (let i = 0; i < mutations.length; i++) {
    const { addedNodes, removedNodes, target, type, attributeName, oldValue } = mutations[i]
    callAll(removedNodes, DISCONNECTED, target)
    callAll(addedNodes, CONNECTED, target)
  }
})



function spect (target, ...children) {
  // TODO: if target is already assigned aspect, skip it or just run aspect (figure out what)

  // <tag>{fn}</tag> -> spect('tag', fn)
  let props
  if (isObject(children[0])) props = children.shift()

  // selector or new element
  // TODO: cache target/type detection in weakmap
  if (typeof target === 'string') {
    const selector = target.trim()

    // TODO: better detection of simple selectors
    // TODO: put into type detector
    let type = TYPE_TAG
    // spect('#id', ...)
    if (selector[0] === '#') {
      type = TYPE_ID
    }
    // spect('.class', ...)
    else if (selector[0] === '.') {
      type = TYPE_CLASS
    }
    // spect(':root complex > selector')
    else if (/[\[\:\s\+\~\>]/.test(selector)) {
      type = TYPE_QUERY
    }

    let isSelector = type === TYPE_QUERY || type === TYPE_CLASS || type === TYPE_ID

    // if not class/id selector - that is hyperscript component
    // idTargets.push(selector.slice(1))
    // classTargets.push(selector.slice(1))
    // queryTargets.push(selector.slice(1))
    // spect('div', ...)

    // TODO: run already existing elements matching selector
  }

  // existing element
  else {
    // register private state, associated with element
    let state = tracking.get(target)
    if (!state) tracking.set(target, state = {node: target, order: 0})

    // TODO: `container` prop, narrowing observer down to target tag
    // identify aspect, assigned to the current invocation position, if that was init already
    let aspect = getAspect(target, state, props, children)

    // run init aspect
    aspect.call(target, target)

    // TODO: for selector target, run an aspect for matched elements
    // TODO: figure out which props to pass to aspect

    // FIXME:
    // if (target.classList) {
    //   target.classList.add(SPECT_CLASS)
    // }
  }


}

function getAspect (target, state, props, children) {
  let aspect

  // FIXME: expect for now children to be a single aspect function
  if (children.length === 1 && typeof children[0] === 'function') aspect = children[0]

  return aspect
}


// register element for tracking
function track (el) {
  let state = {}

  // TODO: build an aspect handler?
  let aspect = buildAspect(target, props, children)

  // TODO: observer allows multiple targets
  // TODO: unregister observer when element is unmounted
  observer.observe(el, {
    childList: true,
    attributes: false,
    subtree: false
  })

  tracking.set(el, state)

  return state
}

function callAll (nodes, toState, target) {
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].classList) continue
    if (nodes[i].classList.contains(SPECT_CLASS)) call(nodes[i], toState, target)
    const els = nodes[i].getElementsByClassName(SPECT_CLASS)
    for (let j = 0; j < els.length; j++) call(els[j], toState, target)
  }
}

function call (node, toState, target) {
  // if node isn't registered yet - turn it on
  if (!tracking.has(node)) {
    let state = []
  }

  const s = tracking.get(node)
  if (state === toState) return
  if (toState === 0 && isConnected(node)) {
    s[2] = CONNECTED
    s[CONNECTED](node, target)
  } else if (toState === 1 && !isConnected(node)) {
    s[DISCONNECTED] = DISCONNECTED
    unmount(node, target)
  }
}

function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}


export default spect
export * from './fx.js'

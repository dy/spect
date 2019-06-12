export function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}

export function h (str, props) {
  if (str.raw) str = String.raw.call(String, str, props)

  let [tagName, id] = str.split('#')

  let classes
  if (id) {
    classes = id.split('.')
    id = classes.shift()
  }
  else {
    classes = tagName.split('.')
    tagName = classes.shift()
  }


  let el = document.createElement(tagName)

  if (id) el.setAttribute('id', id)
  if (classes.length) el.classList.add(...classes)

  if (props) for (let name in props) el.setAttribute(name, props[name])

  return el
}




// the code is borrowed from https://github.com/hyperdivision/fast-on-load/blob/master/index.js
const tracking = new WeakMap()
const clz = 'onload-' + Math.random().toString(36).slice(2)
const observer = new window.MutationObserver(onchange)

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)

let off = true

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
})

export function onload (node, onload, offload) {
  off = false
  node.classList.add(clz)
  tracking.set(node, [ onload || noop, offload || noop, 2 ])
  return node
}

function noop () { }

function callAll (nodes, idx, target) {
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].classList) continue
    if (nodes[i].classList.contains(clz)) call(nodes[i], idx, target)
    const els = nodes[i].getElementsByClassName(clz)
    for (let j = 0; j < els.length; j++) call(els[j], idx, target)
  }
}

function call (node, state, target) {
  const ls = tracking.get(node)
  if (ls[2] === state) return
  if (state === 0 && isConnected(node)) {
    ls[2] = 0
    ls[0](node, target)
  } else if (state === 1 && !isConnected(node)) {
    ls[2] = 1
    ls[1](node, target)
  }
}

function onchange (mutations) {
  if (off) return
  for (let i = 0; i < mutations.length; i++) {
    const { addedNodes, removedNodes, target } = mutations[i]
    callAll(removedNodes, 1, target)
    callAll(addedNodes, 0, target)
  }
}

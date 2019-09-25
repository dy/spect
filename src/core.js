import equal from 'fast-deep-equal'
import { render as prender, h as hs } from 'preact'
import htm from 'htm'
import tuple from 'immutable-tuple'
import { isPrimitive } from './util'

const isStacktraceAvailable = !!(new Error).stack

// run aspect
let fxCount
let current = null
export function run(fn) {
  let prev = current
  fxCount = 0

  // identify consequent fn call
  current = fnState(fn)

  let result
  result = fn()
  if (result && result.then) result = result.then((result) => {
    current.destroy[current.key] = result
    current = prev
  })
  else {
    current.destroy[current.key] = result
    current = prev
  }
}
let fnStates = new WeakMap
function fnState(fn) {
  let state = fnStates.get(fn)
  if (!state) {
    fnStates.set(fn, state = {
      fn, deps: {}, destroy: {}
    })
  }
  return state
}

function callsiteId() {
  let key
  if (isStacktraceAvailable) {
    key = (new Error).stack + ''
  }
  // fallback to react order-based key
  else {
    key = fxCount++
  }
  return key
}

function checkDeps(deps, destroy) {
  if (!current) return true

  let key = callsiteId()

  if (deps == null) {
    let prevDestroy = current.destroy[key]
    if (prevDestroy && prevDestroy.call) prevDestroy()
    current.destroy[key] = destroy
    return true
  }

  let prevDeps = current.deps[key]
  if (deps === prevDeps) return false
  if (!isPrimitive(deps)) {
    if (equal(deps, prevDeps)) return false
  }
  current.deps[key] = deps

  // enter false state - ignore effect
  if (prevDeps === undefined && deps === false) return false

  let prevDestroy = current.destroy[key]
  if (prevDestroy && prevDestroy.call) prevDestroy()

  // toggle/fsm case
  if (deps === false) {
    current.destroy[key] = null
    return false
  }

  current.destroy[key] = destroy
  return true
}

const subscriptions = new WeakMap
export function subscribe(key, aspect = current) {
  if (!aspect) return
  if (!subscriptions.has(key)) {
    subscriptions.set(key, new Set())
  }
  subscriptions.get(key).add(aspect)
}
export function publish(key) {
  if (!subscriptions.has(key)) return
  let subscribers = subscriptions.get(key)
  for (let aspect of subscribers) queue(aspect.fn)
}
let planned
function queue(fn) {
  if (!planned) {
    planned = new Set()
    planned.add(fn)
    Promise.resolve().then(() => {
      for (let fn of planned) run(fn)
      planned = null
    })
  }
}

// render vdom into element
export function render(vdom, el) {
  if (typeof el === 'string') el = $$(el)
  else if (el instanceof Node) prender(vdom, el)
  else el.forEach(el => prender(vdom, el))
}


// build vdom
export const html = htm.bind(h)

// select elements
export function $(sel) {
  return document.querySelector(sel)
}
export function $$(sel) {
  return document.querySelectorAll(sel)
}

function h(tagName, props, ...children) {
  if (typeof tagName !== 'string') return hs(...arguments)

  if (!props) props = {}
  let [tag, id, classes] = parseTagComponents(tagName)
  if (!props.id) props.id = id
  if (!props.class) props.class = classes.join(' ')

  return hs(tag, props, ...children)
}

function parseTagComponents(str) {
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}


// turn function into a web-component
const _destroy = Symbol('destroy')
export function component(fn) {
  class HTMLCustomComponent extends HTMLElement {
    constructor() {
      super()
    }
    connectedCallback() {
      // take over attrs as props
      [...this.attributes].forEach(({ name, value }) => {
        this[name] = value
      })
      new Promise((ok) => {
        setTimeout(() => {
          ok()
          this[_destroy] = fn.call(this, this)
        })
      })
    }
    disconnectedCallback() {
      this[_destroy] && this[_destroy]
    }
  }

  return HTMLCustomComponent
}

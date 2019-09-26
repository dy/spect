import equal from 'fast-deep-equal'
import { isPrimitive } from './util'
import tuple from 'immutable-tuple'

const isStacktraceAvailable = !!(new Error).stack

// run aspect
let fxCount
let current = null
export function run(...fns) {
  return Promise.all(fns.map(fn => {
    if (fn.then) return fn

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
    return result
  }))
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
    let limit = Error.stackTraceLimit
    Error.stackTraceLimit = 5
    key = (new Error).stack + ''
    Error.stackTraceLimit = limit
  }
  // fallback to react order-based key
  else {
    key = fxCount++
  }
  return key
}

export function deps(deps, destroy) {
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

  let prevDestroy = current.destroy[key]
  if (prevDestroy && prevDestroy.call) prevDestroy()

  current.destroy[key] = destroy
  return true
}

const subscriptions = new WeakMap
export function subscribe(key, aspect = current) {
  key = key.length ? tuple(...key) : key
  if (!aspect) return
  if (!subscriptions.has(key)) {
    subscriptions.set(key, new Set())
  }
  subscriptions.get(key).add(aspect)
}
export function publish(key) {
  key = key.length ? tuple(...key) : key
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

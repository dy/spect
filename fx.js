import equal from "fast-deep-equal"
import { CALL_START, CALL_END, publish, subscribe } from './src/core.js'
import tuple from 'immutable-tuple'
import { noop } from './src/util.js'
import $ from './$.js'

// track current aspected element
// FIXME: possible recursive calls (bad, but still)
let currentElement, currentFn, fxCount, currentQueue
subscribe(CALL_START, (element, domain, fn, ...args) => {
  if (domain[0] !== 'use') return
  currentElement = element
  currentFn = fn
  fxCount = 0
  currentQueue = []
})

subscribe(CALL_END, (element, domain, fn, ...args) => {
  if (domain[0] !== 'use') return
  flush()
  currentElement = null
  currentFn = null
  fxCount = null
  currentQueue = null
})

// queue of effects to run after current call
function flush () {
  while (currentQueue.length) {
    let [el, fn, idx] = currentQueue.shift()
    run(el, fn, idx)
  }
}

const destroyCache = new Map
function run (el, fn, idx) {
  // call previous destroy, if any
  let t = tuple(currentElement, currentFn, idx)

  if (destroyCache.has(t)) destroyCache.get(t).call(el)

  publish(CALL_START, el, 'fx', fn)
  let destroy = fn.call(el)
  if (typeof destroy !== 'function') destroy = noop
  destroyCache.set(t, destroy)
  publish(CALL_START, el, 'fx', fn)
}


const depsCache = new Map
$.fn.fx = function (fn, ...deps) {
  // track deps
  if (deps.length) {
    let depsTuple = tuple(currentElement, currentFn, fxCount)
    let prevDeps = depsCache.get(depsTuple) || []
    if (equal(deps, prevDeps)) {
      fxCount++
      return this
    }

    depsCache.set(depsTuple, deps)
  }

  // call after aspect, if there's a queue
  if (currentQueue) {
    this.forEach(el => currentQueue.push([el, fn, fxCount]))
  }
  // or instantly - for global effects
  // FIXME: make sure if that's ok, or better do async next call maybe
  else {
    this.forEach(el => run(el, fn))
  }

  fxCount++

  return this
}

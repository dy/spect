import equal from "fast-deep-equal"
import { $, CALL_START, CALL_END } from './$.js'
import tuple from 'immutable-tuple'

// track current aspected element
// FIXME: possible recursive calls (bad, but still)
let currentElement, currentFn, fxCount, currentQueue
$.subscribe(CALL_START, (element, domain, fn, ...args) => {
  // if (domain[0] !== 'use') return
  currentElement = element
  currentFn = fn
  fxCount = 0
  currentQueue = []
})

$.subscribe(CALL_END, (element, domain, fn, ...args) => {
  flush()
  currentElement = null
  currentFn = null
  fxCount = null
  currentQueue = null
})

// queue of effects to run after current call
function flush () {
  while (currentQueue.length) {
    let [el, fx] = currentQueue.shift()
    fx.call(el)
  }
}


const depsCache = new Map
$.fn.fx = function (fn, ...deps) {
  // track deps
  if (deps !== undefined) {
    let depsTuple = tuple(currentElement, currentFn, fxCount)
    let prevDeps = depsCache.get(depsTuple)

    if (equal(deps, prevDeps)) {
      fxCount++
      return this
    }

    depsCache.set(depsTuple, deps)
  }

  // console.log('fx#' + fxCount, fn.name)
  this.forEach(el => currentQueue.push([el, fn]))

  fxCount++

  return this
}

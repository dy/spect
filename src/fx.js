import equal from "fast-deep-equal"
import $ from './$.js'
import tuple from 'immutable-tuple'

// current [target, fx] call
export let currentAspect

// planned aspects to update after currentAspect call
export let afterCurrentFx = null

// [ target, prop ] : [...aspects] - aspects, assigned to observed tuples
export let observables = new Map()

// set of changed observables [ target, prop ] for currentAspect call
export let currentDiff = null

// prevent recursion
const MAX_DEPTH = 25
let count = 0

$.fn.fx = function (fn, deps) {
  if (count++ > MAX_DEPTH) throw Error('Recursion in fx')

  if (Array.isArray(fn)) return fn.forEach(fn => this.fx(fn, deps))

  // if root call - directly call aspects
  if (!currentAspect) return (call(this, fn), this)

  // plan fx call to the end of currentFx
  afterCurrentFx.add(tuple(this, fn))

  // skip unchanged effect
  // if (fx.has(fn) /* && equal(deps, state.prevDeps) */) return this
  function call ($target, fn) {
    $target.forEach(el => {
      currentAspect = tuple($(el), fn)
      currentDiff = new Map
      afterCurrentFx = new Set

      fn.call(el, currentAspect[0])

      // after current fx - firgure out aspects to update based on diffs
      for (let [observable, [from, to]] of currentDiff) {
        if (Object.is(from, to)) continue
        let observableAspects = observables.get(observable)
        for (let aspect of observableAspects) {
          afterCurrentFx.add(aspect)
        }
      }
      currentDiff.clear()
      currentDiff = null

      // call planned aspects
      for (let [$target, fn] of afterCurrentFx) call($target, fn)

      afterCurrentFx.clear()
      afterCurrentFx = null

      currentAspect = null
      count = 0
    })
  }

  return this
}


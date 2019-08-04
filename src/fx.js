import equal from "fast-deep-equal"
import $ from './$.js'
import tuple from 'immutable-tuple'

// aspect === [target, fx], a token identifying fn called on target, like $target.fx(fn)

// current [target, fx] call
export let currentAspect

// planned aspects to update after currentAspect call
export let currentAfterAspect = null

// [ target, prop ] : [...aspects] - aspects, assigned to observed tuples
export let observables = new Map

// set of changed observables [ target, prop ] for currentAspect call
export let currentDiff = null

// [ aspect, fxId ] : deps - per aspect storage of deps it was called with
// FIXME: generalize aspect into a class, store all these in that class
export let aspectDeps = new Map

// prevent recursion
const MAX_DEPTH = 25
let depth = 0

// identify prev fx
let fxCount = new Map
fxCount.set(undefined, 0)

$.fn.fx = function (fn, deps) {
  if (depth++ > MAX_DEPTH) throw Error('Recursion in fx')

  if (Array.isArray(fn)) return fn.forEach(fn => this.fx(fn, deps))

  // console.log('fx', fn.name, 'deps', deps)

  let thisAspect = tuple(this, fn)

  // get self fx index - required to identify deps within current aspect call
  let fxId = fxCount.get(currentAspect)
  fxCount.set(currentAspect, fxId + 1)

  // track deps
  if (deps !== undefined) {
    let depsTuple = tuple(currentAspect, fxId)
    let prevDeps = aspectDeps.get(depsTuple)
    if (equal(deps, prevDeps)) return

    aspectDeps.set(depsTuple, deps)
  }

  // if root call - directly call
  if (!currentAspect) callAspect(thisAspect)
  // otherwise plan call to the end of currentAspect
  else currentAfterAspect.add(thisAspect)

  return this
}

// skip unchanged effect
export function callAspect([$target, fn]) {
  $target.forEach(el => {
    currentAspect = tuple($(el), fn)
    let parentDiff = currentDiff, parentAfterAspect = currentAfterAspect
    currentDiff = new Map
    currentAfterAspect = new Set

    fxCount.set(currentAspect, 0)

    fn.call(el, currentAspect[0])

    // after current fx - figure out aspects to update based on diffs
    for (let [observable, [from, to]] of currentDiff) {
      if (Object.is(from, to)) continue
      // FIXME: this chunk is repeated in state.js in async set
      let observers = observables.get(observable)
      for (let aspect of observers) {
        currentAfterAspect.add(aspect)
      }
    }
    currentDiff.clear()
    currentDiff = parentDiff

    // call planned aspects
    for (let aspect of currentAfterAspect) callAspect(aspect)

    currentAfterAspect.clear()
    currentAfterAspect = parentAfterAspect

    currentAspect = null
    depth = 0
  })
}

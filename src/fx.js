import equal from "fast-deep-equal"
import { $ } from './$.js'
import tuple from 'immutable-tuple'
import { queue, currentAspect } from "./use.js";

// [ aspect, fxId ] : deps - per aspect storage of deps it was called with
export let depsCache = new Map

let fxCount = 0

$.fn.fx = function (fn, ...deps) {
  // reset fx count for new aspect

  // track deps
  if (deps !== undefined) {
    let depsTuple = tuple(currentAspect, fxCount)
    let prevDeps = depsCache.get(depsTuple)
    if (equal(deps, prevDeps)) return this

    depsCache.set(depsTuple, deps)
  }

  console.log('fx#' + fxCount, fn.name)

  // FIXME: too many count resets
  queue.push(() => fxCount = 0)
  queue.push(fn)

  fxCount++

  return this
}

import equal from "fast-deep-equal"
import $ from './$.js'

export const cache = new WeakMap

$.fn.fx = function (fn, deps) {
  if (Array.isArray(fn)) return fn.forEach(fn => this.fx(fn, deps))

  if (!cache.has(this)) cache.set(this, new WeakSet)
  let fx = cache.get(this)

  // skip existing effect
  if (fx.has(fn)) return this

  // if (!equal(deps, state.prevDeps)) {
  this.forEach(el => fn($(el)))
  // }

  return this
}

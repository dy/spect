import equal from "fast-deep-equal"
import html from "./src/html"

let states = new WeakMap

let cache = new WeakMap

// target is wrapper over collection of items
export default function $(target) {
  if (cache.has(target)) return cache.get(target)

  if (typeof target === 'string') target = document.querySelectorAll(target)

  if (target.length == null) target = [target]

  // FIXME: possibly create promise here? or extend NodeList? or extend documentFragment?
  // That can be a single node though. But can be extended any time on.
  // Ideally we'd have fx, html in prototype.
  // Ideally, we'd have NodeList in prototype.
  // Likely, we have to have promise in prototype.
  let $target = Object.assign(target, $.fn)

  cache.set(target, $target)

  states.set($target, {})

  return $target
}

$.fn = {}


$.fn.fx = function (fn, deps) {
  let state = states.get(this)
  if (!state.fx) state.fx = new WeakSet

  // skip existing effect
  if (state.fx.has(fn)) return this


  // if (!equal(deps, state.prevDeps)) {
    this.forEach(el => fn($(el)))
  // }

  return this
}


// html builder
$.fn.html = html


// FIXME: must be a separate plugin
$.fn.router = function () {

}

import equal from "fast-deep-equal"
import html from "./src/html"

let states = new WeakMap

// FIXME: replace with primitive-pool WeakMap
let cache = new Map

// target is wrapper over collection of items
export default function $(arg) {
  if (arg instanceof Node) {
    if (!cache.has(arg)) cache.set(arg, create([arg]))
    return cache.get(arg)
  }

  // selector can select more nodes than before, so
  if (!cache.has(arg)) cache.set(arg, create([]))

  let $target = cache.get(arg)

  // selector can include new els, so we update the list
  if (typeof arg === 'string') {
    arg = document.querySelectorAll(arg)
  }

  // nodelist/array could have changed, so make sure new els are in the list
  // FIXME: that can be done faster
  $target.length = 0
  $target.push(...arg)

  return $target
}

function create (target) {
  // Ideally we'd have fx, html in prototype to avoid extending each time
  // Possibly proxy would be able to access els by index
  let $target = Object.assign(target, $.fn)

  states.set($target, {})

  return $target
}


$.fn = {}


$.fn.fx = function fx(fn, deps) {
  if (Array.isArray(fn)) return fn.forEach(fn => this.fx(fn, deps))

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

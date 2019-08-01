import equal from "fast-deep-equal"
import html from "./src/html"

let states = new WeakMap

// FIXME: replace with primitive-pool WeakMap
let cache = new Map

// target is wrapper over collection of items
export default function $(arg) {
  if (cache.has(arg)) return cache.get(arg)

  // create nodeList out of any arg
  let target
  if (arg instanceof NodeList) target = arg
  else if (typeof target === 'string') nodeList = document.querySelectorAll(target)
  else if (Array.isArray(arg)) {
    let frag = document.createDocumentFragment()
    arg.forEach(arg => frag.appendChild(arg))
    target = frag.childNodes
  }
  else {
    let frag = document.createDocumentFragment()
    frag.appendChild(arg)
    target = frag.childNodes
  }

  // FIXME: possibly create promise here? or extend NodeList? or extend documentFragment?
  // That can be a single node though. But can be extended any time on.
  // Ideally we'd have fx, html in prototype.
  // Ideally, we'd have NodeList in prototype.
  // Likely, we have to have promise in prototype.
  let $target = Object.assign(target, $.fn)

  cache.set(arg, $target)

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

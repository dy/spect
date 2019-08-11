import { $, GET, SET } from './$.js'
import { raf } from './util.js'
import tuple from 'immutable-tuple'


// target/domainPath can be:
// [*, `state.x.y.x`]
// [*, `attr`] (direct domain)
// [*, `.x.y.z`] (direct props)
// [null, `router`] (global effect)
// FIXME: use private values instead of observables
export let observables = new WeakMap
$.subscribe(GET, (target, domainPath, ...args) => {
  // async callsite, outside of aspects - nothing to subscribe
  if (!currentElement) return

  // subscribe currentAspect target to update
  let observable = tuple(target, ...domainPath)
  if (!observables.has(observable)) observables.set(observable, new Set)
  observables.get(observable).add(currentElement)
})
$.subscribe(SET, (target, domainPath, value, prev, ...args) => {
  let observable = tuple(target, ...domainPath)

  // diff is checked in next frame, required targets to update are figured out
  let observableDiff = diff.get(observable)
  if (!observableDiff) diff.set(observable, observableDiff = [prev, value])
  else observableDiff[1] = value

  // console.log('set diff', diff)

  // current frame is checked on diff automatically, so schedule only async calls
  if (!currentElement) scheduleUpdate()
})


// attach aspects to current target
let useCache = new WeakMap()
export const use = $.fn.use = function use(fn, ...fns) {
  // recurse
  if (fns.length > 1) {
    this.use(fn)
    fns.forEach(fn => this.use(fn))
    return this
  }

  this.forEach(el => {
    // FIXME: replace with privates
    let aspects = useCache.get(el)
    if (!aspects) useCache.set(el, aspects = [])

    // FIXME: take priority into consideration
    if (aspects.indexOf(fn) < 0) aspects.push(fn)

    // schedule update
    queue.push(el)
  })

  scheduleUpdate()

  return this
}


// plans function before the next rerender
let plannedRaf
export function scheduleUpdate () {
  if (plannedRaf) return
  plannedRaf = raf(() => {
    plannedRaf = null
    flush()
  })
}

// FIXME: add recursion catcher
// list of planned targets to re-render the next tick
export const queue = []
export function flush () {
  if (diff.size) calcDiff()
  while (queue.length) {
    let el = queue.shift()
    let aspects = useCache.get(el)
    aspects.forEach(aspect => run(el, aspect))
  }
  // keep flushing while diff is something - leave no diffs in current frame
  if (diff.size) return flush()
}


// set of changed observables [ target, domainPath ] to check the next frame
// FIXME: ideally diff is calculated in webworker, but needs benchmarking
export const diff = new Map
export function calcDiff() {
  // console.log('check diff', diff)
  for (let [observable, [prev, curr]] of diff) {
    if (Object.is(prev, curr)) continue
    observables.get(observable).forEach(el => queue.push(el))
  }
  diff.clear()
}


// current target/aspect running state
export let currentAspect, currentElement
export function run(el, fn) {
  // console.group('run', fn.name)
  // console.log('run', el, fn.name)
  currentElement = el
  currentAspect = fn

  fn.call(el, $(el))

  currentElement = null
  currentAspect = null
  // console.groupEnd()
}

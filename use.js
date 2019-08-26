import { COMMIT, CALL } from './src/core.js'


const useCache = new WeakMap

// attach aspects to current target
export default function use(...fns) {
  let destroy = []

  COMMIT(this, 'use', () => {
    destroy.forEach(fn => fn())
  })

  // use has sync init
  this.forEach(el => {
    // FIXME: replace with privates
    let aspects = useCache.get(el)
    if (!aspects) useCache.set(el, aspects = [])

    // FIXME: take priority into consideration
    fns.forEach(fn => {
      if (aspects.indexOf(fn) < 0) {
        aspects.push(fn)
      }
    })
  })

  // rerender all aspects
  this.forEach(el => {
    useCache.get(el).forEach(fn => {
      CALL(el, () => destroy.push(fn.call(this, el)))
    })
  })

  return this
}



/*
// target/domainPath can be:
// [*, `state.x.y.x`]
// [*, `attr`] (direct domain)
// [*, `.x.y.z`] (direct props)
// [null, `router`] (global effect)
// FIXME: use private values instead of observables
export let observables = new WeakMap
subscribe(GET, (target, domainPath, ...args) => {
  // async callsite, outside of aspects - nothing to subscribe
  if (!currentElement) return

  // subscribe currentAspect target to update
  let observable = tuple(target, ...domainPath)
  if (!observables.has(observable)) observables.set(observable, new Set)
  observables.get(observable).add(currentElement)
})
subscribe(SET, (target, domainPath, value, prev, ...args) => {
  let observable = tuple(target, ...domainPath)

  // diff is checked in next frame, required targets to update are figured out
  let observableDiff = diff.get(observable)
  if (!observableDiff) diff.set(observable, observableDiff = [prev, value])
  else observableDiff[1] = value

  // current frame is checked on diff automatically, so schedule only async calls
  if (!currentElement) {
    scheduleUpdate()
  }
})


// schedules flush to the moment before the next frame
// let plannedRaf
// export function scheduleUpdate () {
//   if (plannedRaf) {
//     return
//   }
//   plannedRaf = raf(() => {
//     plannedRaf = null
//     flush()
//   })
// }

// FIXME: add recursion catcher
// list of planned targets to re-render the next tick
export const queue = []
export function flush () {
  if (diff.size) calcDiff()
  let prev, curr
  while (queue.length) {
    // skip intermediate duplicates
    curr = queue.shift()
    if (curr === prev) continue
    let aspects = useCache.get(curr)
    aspects.forEach(aspect => run(curr, aspect))
    prev = curr
  }
  // keep flushing until diff is drained
  if (diff.size) return flush()
}


// set of changed observables [ target, domainPath ] to check the next frame
// FIXME: ideally diff is calculated in webworker, but needs benchmarking
export const diff = new Map
export function calcDiff() {
  for (let [observable, [prev, curr]] of diff) {
    if (Object.is(prev, curr)) continue
    if (!observables.has(observable)) continue
    observables.get(observable).forEach(el => queue.push(el))
  }
  diff.clear()
}


// current target/aspect running state
export let currentAspect, currentElement
export function run(el, fn) {
  currentElement = el
  currentAspect = fn

  publish(CALL_START, currentElement, 'use', fn)
  fn.call(el, $(el))
  publish(CALL_END, currentElement, 'use', fn)

  currentElement = null
  currentAspect = null
}
*/

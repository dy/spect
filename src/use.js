import $ from './$.js'
import tuple from 'immutable-tuple'

// aspect === [target, fx], a token identifying fn called on target, like $target.fx(fn)

// queue is a sequence of ['fx'|'use'|'is', [context, fn], ...args] to run after current aspect
export let queue = []

// current aspect [$target, fx]
export let currentAspect

// [ $target, prop ] : [...aspects] - aspects, assigned to observed data source
export let observables = new Map

// set of changed observables [ target, prop ] for currentAspect call
export let currentDiff = null


// attach aspects to current target
export const use = $.fn.use = function use(...fns) {

  fns.forEach(fn => {
    // console.log('use', fn.name)
    let aspect = tuple(this, fn)
    queue.push(() => run(aspect))
  })

  flush()

  return this
}


// run aspect
export function run([$target, fn]) {
  // console.group('run', fn.name)
  $target.forEach(el => {
    // console.log('run', el, fn.name)
    currentAspect = tuple(new $(el), fn)
    currentDiff = new Map

    fn.call(el, currentAspect[0])

    // after current fx - figure out aspects to update based on diffs
    let dirtyAspects = new Set
    for (let [observable, [from, to]] of currentDiff) {
      // skip unchanged values
      if (Object.is(from, to)) continue
      let observers = observables.get(observable)
      if (!observers) continue
      for (let aspect of observers) dirtyAspects.add(aspect)
    }
    for (let aspect of dirtyAspects) queue.push(() => run(aspect))

    currentDiff = null
    currentAspect = null
  })
  // console.groupEnd()
}

// run planned aspects
let running = false
export function flush () {
  if (running) return
  running = true
  while (queue.length) {
    let fn = queue.shift()
    fn()
  }
  running = false
}

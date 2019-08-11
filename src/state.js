import { $, SET, GET } from './$.js'


// state is a proxy, forwarding set/get to all target elements
const targetCache = new WeakMap
Object.defineProperty($.fn, 'state', {
  get() {
    if (!targetCache.has(this)) targetCache.set(this, createState(this))
    return targetCache.get(this)
  },

  set(value) {
    console.log('TODO set state', this)
  }
})


const stateCache = new WeakMap
function createState($el) {
  // create stores per element
  $el.forEach(el => {
    if (!stateCache.has(el)) stateCache.set(el, {})
  })

  // FIXME: if in some way the first element is removed from collection/dom, there's potential memory leak
  let firstEl = $el[0]

  return new Proxy(stateCache.get(firstEl), {
    set: (_, prop, value) => {
      $el.forEach(el => {
        let state = stateCache.get(el)

        // skip unchanged value
        if (Object.is(state[prop], value)) return

        let prev = state[prop]
        state[prop] = value

        $.publish(SET, el, ['state', prop], value, prev)
      })

      return true
    },

    get: (state, prop) => {
      // FIXME: what about nested props access/writing?
      // console.log('get', this, prop)

      // return first element state value
      $.publish(GET, firstEl, ['state', prop])

      return state[prop]
    }
  })
}







/*



import { currentAspect, currentDiff, observables, queue, flush, run } from './use.js'
import tuple from 'immutable-tuple'
import 'setimmediate'


let states = new WeakMap()

// FIXME: move planned aspects to possibly root aspect updater
let plannedAspects = new Set

// FIXME: that's super-useful to be moved to a separate lib

Object.defineProperty($.fn, 'state', {
  // get state - creates new pubsub proxy, triggering update of all effects, depending on some props
  // FIXME: for compatibility it should keep orig values, just pubsub
  get() {
    if (!states.has(this)) states.set(this, new Proxy({}, {
      set: (state, prop, value) => {
        // console.log('set', state, prop, value, 'from', currentAspect)

        // skip unchanged value
        if (Object.is(state[prop], value)) return true


        let observable = tuple(this, prop)

        let prev = state[prop]
        state[prop] = value

        $.publish(SET, $target, 'state' + path, value, prev)

        // FIXME: these two cases are the same, triggered at different times
        // current aspect plans rerendering observering aspects after current scope
        if (currentAspect) {
          // FIXME: probably needs deep clone
          // save from/to values for current render aspect
          if (!currentDiff.has(observable)) currentDiff.set(observable, [state[prop], value])
          let dif = currentDiff.get(observable)
          dif[1] = state[prop] = value

          // diff is handled in fx, all changed fx are notified
        }
        // async setter or root setter just directly updates all fx
        else {
          state[prop] = value

          // FIXME: use setImmediate since afterFx is not available
          let observers = observables.get(observable)
          for (let aspect of observers) {
            plannedAspects.add(aspect)
          }
          setImmediate(() => {
            if (!plannedAspects.size) return
            for (let aspect of plannedAspects) queue.push(() => run(aspect))
            plannedAspects.clear()
            flush()
          })
        }

        return true
      },

      get: (state, prop) => {
        // FIXME: what about nested props access/writing?
        // console.log('get', this, prop, 'from', currentAspect)

        $.publish(GET, $target, 'state' + path, prop)

        // subscribe updating current aspect, when the prop is changed
        let observable = tuple(this, prop)
        if (!observables.has(observable)) observables.set(observable, new Set)
        let observers = observables.get(observable)
        if (!observers.has(currentAspect)) observers.add(currentAspect)

        // FIXME: that could be written to current aspect deps

        // add observable to the list of aspect observables (external sources of state updates)
        // if (!aspectObservables.has(currentAspect)) aspectObservables.set(currentAspect, new Set)
        // let observables = aspectObservables.get(currentAspect)
        // let observable = tuple(target, prop)
        // if (!observables.has(observable)) observables.add(observable)

        return target[prop]
      }
    }))

    return states.get(this)
  },

  // set state - reassigns props to current state
  set() {
    console.log('set state', this)
  }
})

*/

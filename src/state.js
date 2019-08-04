import $ from './$.js'
import { currentAspect, currentDiff, observables, callAspect } from './fx.js'
import tuple from 'immutable-tuple'
import 'setimmediate'

let states = new WeakMap()

// FIXME: that's super-useful to be moved to a separate lib

Object.defineProperty($.fn, 'state', {
  // get state - creates new pubsub proxy, triggering update of all effects, depending on some props
  // FIXME: for compatibility it should keep orig values, just pubsub
  get() {
    if (!states.has(this)) states.set(this, new Proxy({}, {
      set: (target, prop, value) => {
        // console.log('set', target, prop, value, 'from', currentAspect)

        // skip unchanged value
        if (Object.is(target[prop], value)) return true

        let observable = tuple(this, prop)

        // current aspect plans rerendering observering aspects after current scope
        if (currentAspect) {
          // FIXME: probably needs deep clone
          // save from/to values for current render aspect
          if (!currentDiff.has(observable)) currentDiff.set(observable, [target[prop], value])
          let dif = currentDiff.get(observable)
          dif[1] = target[prop] = value

          // diff is handled in fx, all changed fx are notified
        }
        // async setter or root setter just directly updates all fx
        else {
          target[prop] = value

          // FIXME: use setImmediate since afterFx is not available
          let observers = observables.get(observable)
          setImmediate(() => {
            for (let aspect of observers) {
              callAspect(aspect)
            }
          })
        }

        return true
      },

      get: (target, prop) => {
        // FIXME: what about nested props access/writing?
        // console.log('get', this, prop, 'from', currentAspect)

        // subscribe updating current aspect, when the prop is changed
        let observable = tuple(this, prop)
        if (!observables.has(observable)) observables.set(observable, new Set)
        let observers = observables.get(observable)
        if (!observers.has(currentAspect)) observers.add(currentAspect)

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


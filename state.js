import { publish, SET, GET } from './src/core.js'
import $ from './$.js'



export default function state (path, value, deps) {
  if (args.length <= 1) return this.state.get(...args)

  if (typeof args[0] === 'object') {
    for (let name in args[0]) {
      this.state.set(name, args[0][name])
    }
    return
  }

  return this.state.set(...args)
}

export function set () {

}

export function get () {
  // FIXME: what about nested props access/writing?

  // reading state must render must make sure component is not dirty before read
  // eg. some component may have planned updating this component state
  // clean(el)
  plan(el, 'state')

  // return first element state value
  this.forEach(el => publish(GET, el, ['state', prop]))

  return state[prop]
}


const stateCache = new WeakMap
function createState($el) {
  // create stores per element
  $el.forEach(el => {
    if (!stateCache.has(el)) stateCache.set(el, {})
  })

  // FIXME: if in some way the first element is removed from collection/dom, there's potential memory leak
  let firstEl = $el[0]

  // FIXME: how can we put proxy to prototype for nicer console.log
  // let holder = Object.create(

  return new Proxy(stateCache.get(firstEl), {
    set: (_, prop, value, receiver) => {
      $el.forEach(el => {
        let state = stateCache.get(el)

        // skip unchanged value
        if (Object.is(state[prop], value)) return

        let prev = state[prop]
        state[prop] = value

        publish(SET, el, ['state', prop], value, prev)
      })

      return true
    },

    get: (state, prop) => {
      // FIXME: what about nested props access/writing?

      // return first element state value
      $el.forEach(el => publish(GET, el, ['state', prop]))

      return state[prop]
    }
  })
}


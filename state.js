import { publish, SET, GET } from './src/core.js'
import $ from './$.js'


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


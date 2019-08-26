import { SET, GET } from './src/core.js'



export default function state (...args) {
  if (args.length <= 1) return get(this, ...args)

  if (typeof args[0] === 'object') {
    let props = args.shift()
    for (let name in props) {
      set(this, name, props[name], ...args)
    }
    return
  }

  return set(this, ...args)
}

export function set (target, name, value, ...args) {
  // console.log('set', target, name, value, deps)

  target.forEach(el => {
    let state = stateCache.get(el)
    if (!state) stateCache.set(el, state = {})

    // skip unchanged value
    if (Object.is(state[name], value)) return

    let prev = state[name]
    state[name] = value

    commit(SET, el, 'state', name, value)
  })
}

export function get (target, name) {
  console.log('get', target, name)
  // FIXME: what about nested props access/writing?

  let el = target[0]

  commit(GET, el, 'state', name)

  if (!stateCache.has(el)) return
  return stateCache.get(el)[name]
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


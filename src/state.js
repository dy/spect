import $ from './$.js'

let cache = new WeakMap()

// FIXME: that's super-useful to be moved to a separate lib

Object.defineProperty($.fn, 'state', {
  // get state - creates new pubsub proxy, triggering update of all effects, depending on some props
  // FIXME: for compatibility it should keep orig values, just pubsub
  get() {
    if (!cache.has(this)) cache.set(this, new Proxy({}, {
      set: (a, b, c) => {
        console.log('set', a, b, c)
        return true
      },

      // whenever property is read from holder, we register current aspect to be updatable whenever that property is set
      get: (a, b, c) => {
        console.log('get', a, b, c)
      }
    }))

    return cache.get(this)
  },

  // set state - reassigns props to current state
  set() {
    console.log('set', this)
  }
})


// attribute effect

import $ from './$.js'

let attrCache = new WeakMap

Object.defineProperty($.fn, 'attr', {
  // get state - creates new pubsub proxy, triggering update of all effects, depending on some props
  // FIXME: for compatibility it should keep orig values, just pubsub
  get() {
    console.log('Get attr', this)

    if (!attrCache.has(this)) {
      // FIXME: add to current aspect deps list
      attrCache.set(this, )
    }
  },

  // set: ($el, name, value) => {
  //   console.log('Set attr', $el, name)
  // },

  // apply: ($el, thisArg, args) => {
  //   console.log('Apply attr', $el, thisArg)
  // }
})

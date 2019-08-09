// attribute effect

import $ from './$.js'


$.fn.attr = new Proxy(() => {}, {
  get: ($el, name) => {
    console.log('Get attr', $el, name)
  },

  set: ($el, name, value) => {
    console.log('Set attr', $el, name)
  },

  apply: ($el, thisArg, args) => {
    console.log('Apply attr', $el, thisArg)
  }
})

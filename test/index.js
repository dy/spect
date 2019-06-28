import {test, assert} from '../node_modules/tape-modern/dist/tape-modern.esm.js'

assert.deepEqual = (a, b, msg) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      console.error('Not deepEqual', a, b)
      throw Error(msg)
    }
  }
}

// tick is required to let mutation pass
export function delay (delay=0) { return new Promise((ok) => setTimeout(ok, delay))}
export const t = test

export const tick = delay()


import ('./mount.js')
// import('./core.js')
// import('./selector.js')



// props
// apply to target
// apply to selector
// CRUD
// updating causes change



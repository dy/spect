import { current, on } from './src/core'

let cache = new WeakSet

export default function init (fn) {
  commit(SET, this, 'init', fn)

  // ignore initialized effects
  if (!DEPS(() => {

  }, [])) return

  if (!cache.has(current)) {

  }
}

on('use',)

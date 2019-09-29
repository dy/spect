import { createEffect } from './util'
import pathToRegexp from 'path-to-regexp'

const cache = {}
export default createEffect(
  'route',
  function get(str) {
    let re = cache[str]
    if (!re) re = cache[str] = pathToRegexp(str)

    let match = re.exec(window.location.pathname)

    return state.data
  },
  function set(str, obj) {
    return true
  }
)

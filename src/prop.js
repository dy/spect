import {createEffect} from './util'

export default createEffect('prop', function get(target) {
  return target
}, Object.assign)

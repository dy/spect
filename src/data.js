import equal from 'fast-deep-equal'
import tuple from 'immutable-tuple'
import { publish, subscibe } from './core'
import { createEffect } from './util'

export default createEffect(function data(el) {
  return el.dataset
})

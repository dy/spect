// selector-observer based impl
import { run } from './core'
import { observe } from 'selector-observer'
import { fire } from './on-delegated'

export default function use(selector, fn) {
  observe(selector, {
    initialize(el) {
      fire(el, 'init', {selector})
      run(() => fn(el))
    },
    add(el) {
      fire(el, 'connected', {selector})
    },
    remove(el) {
      fire(el, 'disconnected', {selector})
    }
  })
}

import { run } from './core'
import { observe } from 'selector-observer'
import { fire } from 'delegated-events'

export default function use(selector, fn) {
  observe(selector, {
    initialize(el) {
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


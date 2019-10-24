import regularElements from 'regular-elements'
import { isIterable, ReadableStream } from './util'

const selectors = new Map
const instances = new WeakSet

export default function $(selector, callback) {
  return new ReadableStream({
    start(controller) {
      if (isIterable(selector)) {
        selector.forEach(init)
      }
      else {
        init(selector)
      }

      function init(selector) {
        let isFirst = false
        if (!selectors.has(selector)) {
          selectors.set(selector, [])
          isFirst = true
        }

        selectors.get(selector).push((el) => {
          controller.enqueue(el)
          callback && callback(el)
        })

        if (isFirst) {
          let observers = selectors.get(selector)
          regularElements.define(selector, {
            onconnected(e) {
              if (instances.has(this)) return
              instances.add(this)

              observers.forEach(fn => fn(this))

              // duplicate event since it's not emitted
              e.currentTarget.dispatchEvent(new CustomEvent(e.type))
            }
          })
        }

      }
    },
    cancel(reason) {
      observers.splice(observers.indexOf(fn), 1)
      stream.done = true
    }
  })
}

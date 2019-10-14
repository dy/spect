import wickedElements from 'wicked-elements'
import { isIterable } from './util'

// export default function $(selector, within = document) {
//   if (isElement(selector)) return selector
//   if (isIterable(within)) within = within[0]
//   if (selector[0] === '#') return within.querySelector(selector)

//   return within.querySelectorAll(selector)
// }

const cache = new Map

export default function $ (selector, callback) {
  let observers = cache.get(selector)

  let resolve, queue = [new Promise(ok => resolve = ok)]

  let fn = el => {
    callback && callback(el)
    resolve({ value: el })
    let p = new Promise(ok => resolve = ok)
    stream.then = p.then.bind(p)
    queue.push(p)
  }

  let isFirst = false
  if (!observers) {
    isFirst = true
    cache.set(selector, observers = [fn])
  }
  else {
    observers.push(fn)
  }

  let stream = {
    cancel() {
      observers.splice(observers.indexOf(fn), 1)
      stream.done = true
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (stream.done) return { done: true }
          this.i++
          let p = queue.shift()
          return p
        },
        return() {
          stream.cancel()
        }
      }
    },
    done: false,
    then: queue[0].then.bind(queue[0])
  }

  if (isFirst) {
    Promise.resolve().then(() => {
      if (isIterable(selector)) {
        selector.forEach(el => wickedElements.define(el, { init(e) { init(el) } }))
      }
      else {
        wickedElements.define(selector, {
          // we have to async-init in order to make initial await non-blocking
          init(e) { init(e.currentTarget); e.currentTarget.dispatchEvent(new CustomEvent(e.type)) },
          onconnected(e) {},
          ondisconnected(e) {}
        })
      }
    })

    function init(el) {
      observers.forEach(fn => fn(el))
    }
  }

  return stream
}

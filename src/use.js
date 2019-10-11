import wickedElements from 'wicked-elements'

const cache = new Map

export default function use (selector, callback) {
  let observers = cache.get(selector)

  let resolve, queue = [new Promise(ok => resolve = ok)]

  let fn = el => {
    callback && callback(el)
    resolve({ value: el })
    let p = new Promise(ok => resolve = ok)
    handle.then = p.then.bind(p)
    queue.push(p)
  }

  if (!observers) {
    cache.set(selector, observers = [])

    let els = document.querySelectorAll(selector)
    els.forEach(el => wickedElements.define(el, { init(e) { Promise.resolve().then(() => init(el)) } }))
    wickedElements.define(selector, { init(e) { init(e.currentTarget) } })

    function init (el) {
      observers.forEach(fn => fn(el))
    }
  }

  observers.push(fn)


  let handle = {
    end() {
      observers.splice(observers.indexOf(fn), 1)
      handle.done = true
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (handle.done) return { done: true }
          this.i++
          let p = queue.shift()
          return p
        },
        return() {
          handle.end()
        }
      }
    },
    done: false,
    then: queue[0].then.bind(queue[0])
  }

  return handle
}

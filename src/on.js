import { on as addEventListener, off } from 'emmy'

export default function on (target, event, callback) {
  let resolve, queue = [new Promise(ok => resolve = ok)]

  addEventListener(target, event, e => {
    callback && callback(e)
    resolve({ value: e })
    let p = new Promise(ok => resolve = ok)
    handle.then = p.then.bind(p)
    queue.push(p)
  })

  let handle = {
    end() {
      off(target, event)
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

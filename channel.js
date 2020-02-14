// events bus - cancelable, thenable
import Cancelable from './cancelable.js'

export default function channel(callback, teardown) {
  let resolve, promise = new Cancelable(r => resolve = r)

  const ch = (...args) => {
    if (ch.isCanceled) return
    resolve(...args)
    promise = new Cancelable(r => resolve = r)
    return callback && callback.call && callback(...args)
  }

  Object.assign(ch, {
    async *[Symbol.asyncIterator]() {
      try {
        while (1) yield await promise
      } catch (e) {
      } finally {
      }
    },
    cancel(reason) {
      if (teardown && teardown.call) teardown(reason)
      ch.isCanceled = true
      return promise.cancel(reason)
    },
    then(...args) {
      return promise.then(...args)
    },
    isCanceled: false
    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })

  return ch
}

// events bus - cancelable, thenable
import Cancelable from './cancelable.js'

export default function channel(callback, teardown) {
  let resolve, promise = new Cancelable(r => resolve = r)

  const ch = (...args) => {
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
      return promise.cancel(reason)
    },
    then(...args) {
      return promise.then(...args)
    }

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  })

  return ch
}

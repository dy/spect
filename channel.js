// events bus - cancelable, thenable
import Cancelable from './cancelable.js'

export default function channel(callback) {
  let resolve, promise = new Cancelable(r => resolve = r)

  const ref = {
    emit(e) {
      resolve(e)
      promise = new Cancelable(r => resolve = r)
      callback(e)
    },
    async *[Symbol.asyncIterator]() {
      try {
        while (1) yield await promise
      } catch (e) {
      } finally {
      }
    },
    cancel(reason) {
      return promise.cancel(reason)
    },
    then(...args) {
      return promise.then(...args)
    }

    // Observable
    // async subscribe(cb) { for await (let value of ref) cb(value) }
  }

  return ref
}

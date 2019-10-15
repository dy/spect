import { on as addEventListener, off } from 'emmy'

export default function on (target, event, callback) {
  let fn
  return new ReadableStream({
    start(controller) {
      fn = (e) => {
        controller.enqueue(e)
        callback && callback(e)
      }
      addEventListener(target, event, fn)
    },
    pull(controller) {
    },
    cancel(reason) {
      this.done = true
      off(target, event, fn)
    }
  })
}

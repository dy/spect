import { on as addEventListener } from 'emmy'

export default function on (target, event, callback, o) {
  let off
  return new ReadableStream({
    start(controller) {
      off = addEventListener(target, event, (e) => {
        controller.enqueue(e)
        callback && callback(e)
      }, o)
    },
    pull(controller) {
    },
    cancel(reason) {
      this.done = true
      off()
    }
  })
}

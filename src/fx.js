import { setMicrotask } from "./util"

export default function fx(...args) {
  let callback = args.pop()

  return new ReadableStream({
    start(controller) {
      let values = Array(args.length)
      let planned = null

      if (!args.length) {
        Promise.resolve().then(() => {
          callback && callback()
          controller.enqueue()
        })
        return
      }

      args.forEach(async (dep, i) => {
        for await (const value of dep) {
          values[i] = value

          if (!planned) planned = setMicrotask(() => {
            planned = null
            controller.enqueue(...values)
            callback && callback(...values)
          })
        }
      })
    },
    pull(controller) {
    },
    cancel(reason) {
      this.done = true
    }
  })
}

export default function fx(...args) {
  let callback = args.pop()
  let resolve, p = new Promise(ok => resolve = ok)

  let values = Array(args.length)
  if (args.length) {
    args.forEach(async (dep, i) => {
      // FIXME: think of batch updating values
      for await (const value of dep) {
        values[i] = value
        callback && callback(...values)
        resolve({ value: values })
        p = new Promise(ok => resolve = ok)
        stream.then = p.then.bind(p)
      }
    })
  }
  else {
    Promise.resolve().then(() => {
      callback && callback()
      resolve({ value: [] })
      p = new Promise(ok => resolve = ok)
      stream.then = p.then.bind(p)
    })
  }

  let stream = {
    cancel() {
      stream.done = true
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (stream.done) return { done: true }
          this.i++
          return p
        },
        return() {
          stream.cancel()
        }
      }
    },
    then: p.then.bind(p)
  }

  return stream
}

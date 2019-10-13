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
        handle.then = p.then.bind(p)
      }
    })
  }
  else {
    Promise.resolve().then(() => {
      callback && callback()
      resolve({ value: [] })
      p = new Promise(ok => resolve = ok)
      handle.then = p.then.bind(p)
    })
  }

  let handle = {
    end() {
      handle.done = true
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (handle.done) return { done: true }
          this.i++
          return p
        },
        return() {
          handle.end()
        }
      }
    },
    then: p.then.bind(p)
  }

  return handle
}

import { run } from './core'

export default function fx(...args) {
  let callback = args.pop()
  let resolve, p = new Promise(ok => resolve = ok)

  let values = Array(args.length)
  args.forEach(async (dep, i) => {
    // FIXME: think of batch updating values
    for await (const value of dep) {
      values[i] = value
      callback && callback(...values)
      resolve({ value: values })
      p = new Promise(ok => resolve = ok)
      end.then = p.then.bind(p)
    }
  })

  function end() {
    end.done = true
  }
  end[Symbol.asyncIterator] = () => {
    return {
      i: 0,
      next() {
        if (end.done) return { done: true }
        this.i++
        return p
      },
      return() {
        end()
      }
    }
  }
  end.then = p.then.bind(p)

  return end
}

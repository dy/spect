const cache = new WeakMap

export default function any(...args) {
  args = args.flat()

  if (!args.length) throw Error('`any` expects at least one input async generator')

  if (args.length === 1) return args[0]

  let resolve, p = new Promise(ok => resolve = ok)

  let currentValues = []

  args.forEach(input => {
    for await (const value of input) {

    }
  })
        resolve(currentValue)
        p = new Promise(ok => resolve = ok)

  return observer.asyncGen
}

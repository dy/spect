import tuple from 'immutable-tuple'

// run aspect
export let current = null
export function run(fn) {
  let prev = current

  // identify consequent fn call
  current = fn

  let result = fn()

  if (result && result.then) return result.then(result => {
    current = prev
    return result
  })

  current = prev
  return result
}

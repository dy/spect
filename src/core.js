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

let planned
export function queue(fn) {
  if (!planned) {
    planned = new Set()
    Promise.resolve().then(() => {
      let fns = planned
      planned = null
      for (let fn of fns) fn()
    })
  }
  planned.add(fn)
}

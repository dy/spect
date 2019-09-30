import tuple from 'immutable-tuple'

// run aspect
let current = null
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

const subscriptions = new WeakMap
export function subscribe(key, fn = current) {
  key = key.length ? tuple(...key) : key
  if (!fn) return
  if (!subscriptions.has(key)) {
    subscriptions.set(key, new Set())
  }
  subscriptions.get(key).add(fn)
}
export function publish(key) {
  key = key.length ? tuple(...key) : key
  if (!subscriptions.has(key)) return
  let subscribers = subscriptions.get(key)
  for (let fn of subscribers) queue(fn)
}

let planned
export function queue(fn) {
  if (!planned) {
    planned = new Set()
    planned.add(fn)
    Promise.resolve().then(() => {
      let fns = planned
      planned = null
      for (let fn of fns) run(fn)
    })
  }
}

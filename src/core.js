import tuple from 'immutable-tuple'

// run aspect
let current = null
export function run(...fns) {
  return Promise.all(fns.map(fn => {
    if (fn.then) return fn

    let prev = current

    // identify consequent fn call
    current = fn

    let result = fn()
    if (result && result.then) result = result.then((result) => {
      current.destroy[current.key] = result
      current = prev
    })
    else {
      current.destroy[current.key] = result
      current = prev
    }
    return result
  }))
}

const subscriptions = new WeakMap
export function subscribe(key, aspect = current) {
  key = key.length ? tuple(...key) : key
  if (!aspect) return
  if (!subscriptions.has(key)) {
    subscriptions.set(key, new Set())
  }
  subscriptions.get(key).add(aspect)
}
export function publish(key) {
  key = key.length ? tuple(...key) : key
  if (!subscriptions.has(key)) return
  let subscribers = subscriptions.get(key)
  for (let aspect of subscribers) queue(aspect.fn)
}
let planned
function queue(fn) {
  if (!planned) {
    planned = new Set()
    planned.add(fn)
    Promise.resolve().then(() => {
      for (let fn of planned) run(fn)
      planned = null
    })
  }
}

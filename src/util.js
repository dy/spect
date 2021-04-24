// lil subscriby (v-less)
export const sube = (target, fn) => {
  let unsub, stop
  if (target[Symbol.observable]) unsub = target[Symbol.observable]().subscribe({next:fn})
  else if (target.subscribe) unsub = target.subscribe(fn)
  else if (target[Symbol.asyncIterator]) {
    unsub = () => stop = true
    ;(async () => { for await (target of target) { if (stop) break; fn(target) } })()
  }
  else if (target.then) target.then(fn)
  else if (typeof target === 'function' && target.set) unsub = target(fn)
  return unsub
}

// not so generic, but performant
export const primitive = (val) =>
  !val ||
  typeof val === 'string' ||
  typeof val === 'boolean' ||
  typeof val === 'number' ||
  (typeof val === 'object' ? (val instanceof RegExp || val instanceof Date) :
  typeof val !== 'function')

export const observable = (arg) => !primitive(arg) &&
  !!(
    arg[Symbol.observable] || arg[Symbol.asyncIterator] ||
    (typeof arg === 'function' && arg.set) ||
    arg.next || arg.then
    // || arg.mutation && arg._state != null
  )

export const observer = (next, error, complete) => (next && next.call) || (error && error.call) || (complete && complete.call) || (next && observer(next.next, next.error, next.complete))

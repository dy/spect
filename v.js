export default function v() {
  const observers = [], current = [],
  get = () => current.length > 1 ? current : current[0],
  set = (...args) => (
    args = (typeof args[0] === 'function' ? args[0](...current) : args),
    Array.isArray(args) ? args.map((val, i) => current[i] = val) : current[0] = args,
    observers.map(sub => (
      (typeof sub.cleanup === 'function') && sub.cleanup(),
      (sub.next) && (sub.cleanup = sub.next(...current))
    ))
  ),
  error = e => observers.map(sub => sub.error && sub.error(e)),
  fn = (...args) => (!fn.closed && (args.length ? set(...args) : get())),
  subscribe = (next, error, complete) => {
    next = next && next.next || next
    error = next && next.error || error
    complete = next && next.complete || complete

    const unsubscribe = () => (
      observers.length && observers.splice(observers.indexOf(subscription) >>> 0, 1),
      complete && complete()
    ),
    subscription = { next, error, complete, unsubscribe, out:null }
    observers.push(subscription)
    if (current.length) subscription.cleanup = next(...current)
    return unsubscribe.unsubscribe = unsubscribe
  },
  map = map => {
    const mapped = v()
    fn.subscribe((...args) => mapped(map(...args)))
    return mapped
  }

  if (arguments.length) set(...arguments)

  return Object.assign(fn, {
    closed: false,
    valueOf: fn,
    toString: fn,
    [Symbol.toPrimitive]: (hint) => fn(),

    // FIXME: replace with 0b
    subscribe, map,
    [Symbol.observable||(Symbol.observable=Symbol('observable'))]: () => fn,
    async *[Symbol.asyncIterator]() {
      let resolve, buf = [], p = new Promise(r => resolve = r),
        unsub = fn.subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))
      try { while (1) yield* buf.splice(0), await p }
      catch {}
      finally { unsub() }
    },

    [Symbol.dispose||(Symbol.dispose=Symbol('dispose'))]: () => {
      current.length = 0
      const unsubs = observers.map(sub => ((typeof sub.cleanup === 'function') && sub.cleanup(), sub.unsubscribe))
      observers.length = 0
      unsubs.map(unsub => unsub())
      fn.closed = true
    }
  })
}

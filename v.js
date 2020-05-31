import { symbol } from './src/util.js'

export default function v(init) {
  const observers = [],
  get = () => fn.current,
  set = val => (
    fn.current = typeof val === 'function' ? val(fn.current) : val,
    observers.map(sub => (
      (sub.out && sub.out.call) && sub.out(),
      (sub.next) && (sub.out = sub.next(val))
    ))
  ),
  error = e => observers.map(sub => sub.error && sub.error(e)),
  fn = (...args) => (!fn.closed && (args.length ? set(args[0]) : get()))

  if (arguments.length) set(init)

  return Object.assign(fn, {
    closed: false,
    valueOf: fn,
    toString: fn,
    [Symbol.toPrimitive]: (hint) => fn(),

    // FIXME: replace with 0b
    subscribe: (next, error, complete) => {
      next = next && next.next || next
      error = next && next.error || error
      complete = next && next.complete || complete

      const unsubscribe = () => {
          if (observers.length) observers.splice(observers.indexOf(subscription) >>> 0, 1)
          if (complete) complete()
          unsubscribe.closed = true
      }
      unsubscribe.unsubscribe = unsubscribe
      unsubscribe.closed = false

      const subscription = { next, error, complete, unsubscribe, out:null }
      observers.push(subscription)

      if ('current' in fn) subscription.out = next(get())

      return unsubscribe
    },
    map: map => {
      const mapped = v()
      fn.subscribe(v => mapped(map(v)))
      return mapped
    },

    [symbol.observable]: () => fn,
    async *[Symbol.asyncIterator]() {
      let resolve, buf = [], p = new Promise(r => resolve = r),
        unsub = fn.subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))
      try { while (1) console.log(123),yield* buf.splice(0), await p }
      catch {}
      finally { unsub() }
    },
    [symbol.dispose]: () => {
      delete fn.current

      const unsubs = observers.map(sub => {
        if (sub.out && sub.out.call) sub.out()
        return sub.unsubscribe
      })
      observers.length = 0
      unsubs.map(unsub => unsub())
      fn.closed = true
    }
  })
}

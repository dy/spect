// functional style of channel
// possibly more compact, but has a bit more memory footprint

export default function Channel (get, set) {
  const observers = []

  function push (v, dif) {
    if (v && v.then) v.then(push.bind(this))
    else this.current = v, (Array.isArray(this) ? this : channel.observers)
      .map(sub => {
        if (sub.out && sub.out.call) sub.out()
        if (sub.next) sub.out = sub.next(v, dif)
      })
  }

  const error = (e) => observers.map(sub => sub.error && sub.error(e))

  const close = () => {
      let unsubs = observers.map(sub => {
          if (sub.out && sub.out.call) sub.out()
          return sub.unsubscribe
      })
      observers.length = 0
      unsubs.map(unsub => unsub())
      channel.closed = true
  }

  const subscribe = (next, error, complete) => {
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

      const subscription = { next, error, complete, unsubscribe }
      observers.push(subscription)

      return unsubscribe
  }

  const channel = (...vals) => observer(...vals) ? subscribe(...vals) : push(...vals)

  function fn () {
    if (channel.closed) return
    if (!arguments.length) return get()
    if (observer.apply(null, arguments)) {
      let unsubscribe = channel.subscribe(...arguments)
      // callback is registered as the last channel subscription, so send it immediately as value
      if ('current' in channel) channel.push.call(channel.observers.slice(-1), get(), get())
      return unsubscribe
    }
    return set.apply(null, arguments)
  }

  // delete channel.length

  // Object.defineProperties(channel, {
  //   valueOf: desc(get),
  //   toString: desc(get),
  //   [Symbol.toPrimitive]: desc(get),
  //   [symbol.observable]: desc(() => channel),
  //   [symbol.dispose]: desc(channel.close.bind(channel)),
  //   [Symbol.asyncIterator]: desc(async function*() {
  //     let resolve = () => {}, buf = [], p,
  //     unsubscribe = fn(v => (buf.push(v), resolve(), p = new Promise(r => resolve = r)))
  //     try {
  //       while (1) {
  //         // while (buf.length) yield buf.shift()
  //         yield* buf.splice(0)
  //         await p
  //       }
  //     } catch {
  //     } finally {
  //       unsubscribe()
  //     }
  //   })
  // })

  return Object.assign(channel, {
    get, set, fn,
    observers,
    closed: false,
    push,
    subscribe,
    close,
    error
  })
}


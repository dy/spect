import { observer, desc, symbol } from './util.js'

// class version of channel, supposed to be faster than funciton and consume less memory - not proved to be true
export default class Channel {
  constructor(get, set) {
    this.observers = []
    this.closed = false

    // last pushed value
    this.current

    this.get = get
    this.set = set

    // FIXME: please, move that to prototype...
    // may require reworking v to return a channel function
    const fn = this.fn = this.fn.bind(this)
    Object.defineProperties(this.fn, {
      valueOf: desc(get),
      toString: desc(get),
      [Symbol.toPrimitive]: desc(get),
      [symbol.observable]: desc(() => this),
      [symbol.dispose]: desc(this.close.bind(this)),
      [Symbol.asyncIterator]: desc(async function*() {
        let resolve = () => {}, buf = [], p,
        unsubscribe = fn(v => (buf.push(v), resolve(), p = new Promise(r => resolve = r)))
        try {
          while (1) {
            // while (buf.length) yield buf.shift()
            yield* buf.splice(0)
            await p
          }
        } catch {
        } finally {
          unsubscribe()
        }
      })
    })
  }
  // universal get/set/sub function
  fn(){
    if (this.closed) return
    if (!arguments.length) return this.get()
    if (observer(...arguments)) {
      let unsubscribe = this.subscribe(...arguments)
      // callback is registered as the last this subscription, so send it immediately as value
      if ('current' in this) this.push.call(this.observers.slice(-1), this.get(), this.get())
      return unsubscribe
    }
    return this.set.apply(null,arguments)
  }
  push(v, dif){
    if (v && v.then) v.then((v, dif) => this.push(v, dif))
    else this.current = v, (Array.isArray(this) ? this : this.observers).map(sub => {
      if (sub.out && sub.out.call) sub.out()
      if (sub.next) sub.out = sub.next(v, dif)
    })
  }
  subscribe(next, error, complete){
    next = next && next.next || next
    error = next && next.error || error
    complete = next && next.complete || complete

    const unsubscribe = () => {
        if (this.observers.length) this.observers.splice(this.observers.indexOf(subscription) >>> 0, 1)
        if (complete) complete()
        unsubscribe.closed = true
    }
    unsubscribe.unsubscribe = unsubscribe
    unsubscribe.closed = false

    const subscription = { next, error, complete, unsubscribe }
    this.observers.push(subscription)

    return unsubscribe
  }
  close(){
    let unsubs = this.observers.map(sub => {
      if (sub.out && sub.out.call) sub.out()
      return sub.unsubscribe
    })
    this.observers.length = 0
    unsubs.map(unsub => unsub())
    this.closed = true
  }
  error(e){
    this.observers.map(sub => sub.error && sub.error(e))
  }
}

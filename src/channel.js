export default class Channel {
  constructor() {
    this.observers = []
    this.closed = false

    // keeps last pushed channel state
    this.current
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



// function fn () {
// if (channel.closed) return
// if (!arguments.length) return get()
// if (observer.apply(null, arguments)) {
//   let unsubscribe = channel.subscribe(...arguments)
//   channel.push.call(channel.observers.slice(-1), get(), get())
//   return unsubscribe
// }
// return set.apply(null, arguments)
// }
// function fn () {
// if (channel.closed) return
// if (!arguments.length) return get()
// if (observer.apply(null, arguments)) {
//   let unsubscribe = channel.subscribe(...arguments)
//   channel.push.call(channel.observers.slice(-1), get(), get())
//   return unsubscribe
// }
// return set.apply(null, arguments)
// }
// function fn () {
// if (channel.closed) return
// if (!arguments.length) return get()
// if (observer.apply(null, arguments)) {
//   let unsubscribe = channel.subscribe(...arguments)
//   // callback is registered as the last channel subscription, so send it immediately as value
//   if ('current' in channel) channel.push.call(channel.observers.slice(-1), get(), get())
//   return unsubscribe
// }
// return set.apply(null, arguments)
// }

export default class Channel {
  constructor() {
    this.observers = []
    this.closed = false
  }
  push(...vals){
    (Array.isArray(this) ? this : this.observers).map(sub => {
      if (sub.out && sub.out.call) sub.out()
      if (sub.next) sub.out = sub.next(...vals)
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

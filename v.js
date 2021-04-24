export default (init) => new Ref(init)

class Ref {
  constructor(arg){
    // FIXME: use private maybe?
    Object.defineProperties(this, {
      observers: {value:[]},
    })
    this[0] = arg
  }

  get value() { return this[0] }
  set value(val) {
    this[0] = val
    for (let sub of this.observers) {
      if (typeof sub._teardown === 'function') sub._teardown()
      if (sub.next) (sub._teardown = sub.next(val))
    }
  }

  valueOf() {return this.value}
  toString() {return this.value}
  [Symbol.toPrimitive](hint) {return this.value}

  // FIXME: replace with 0b?
  subscribe(next, error, complete) {
    next = next && next.next || next
    error = next && next.error || error
    complete = next && next.complete || complete

    const unsubscribe = () => (
      this.observers.length && this.observers.splice(this.observers.indexOf(subscription) >>> 0, 1),
      complete && complete()
    ),
    subscription = { next, error, complete, unsubscribe, _teardown:null }
    this.observers.push(subscription)

    if ( this[0] !== undefined ) subscription._teardown = next(this[0])

    return unsubscribe.unsubscribe = unsubscribe
  }

  map(mapper) {
    const ref = new Ref()
    this.subscribe(v => ref.value = mapper(v))
    return ref
  }

  error(e) {this.observers.map(sub => sub.error && sub.error(e))}

  [Symbol.observable||(Symbol.observable=Symbol('observable'))](){return this}

  async *[Symbol.asyncIterator]() {
    let resolve, buf = [], p = new Promise(r => resolve = r),
      unsub = this.subscribe(v => ( buf.push(v), resolve(), p = new Promise(r => resolve = r) ))
    try { while (1) yield* buf.splice(0), await p }
    catch {}
    finally { unsub() }
  }

  [Symbol.dispose||(Symbol.dispose=Symbol('dispose'))]() {
    this[0] = null
    const unsubs = this.observers.map(sub => ((typeof sub._teardown === 'function') && sub._teardown(), sub.unsubscribe))
    this.observers.length = 0
    unsubs.map(unsub => unsub())
  }
}

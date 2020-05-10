import { desc, channel as Channel, observer, symbol, attr } from './src/util.js'

export default function a(target, path) {
  const channel = Channel()

  function fn () {
    if (channel.closed) return
    if (!arguments.length) return get()
    if (observer.apply(null, arguments)) {
      let unsubscribe = channel.subscribe.apply(null, arguments)
      channel.push.call(channel.observers.slice(-1), get())
      return unsubscribe
    }
    return set.apply(null, arguments)
  }

  const proto = Object.getPrototypeOf(target)
  const orig = Object.getOwnPropertyDescriptor(target, path)
  let sync

  if (target.setAttribute) {
    sync = (attr) => {
      // own HTMLElement prototype props (like style, onxxx, class etc.) are expected to react themselves on attr update
      if (path in proto) return target[path] !== attr ? channel.push(target[path]) : null

      attr = attr === '' ? true : attr
      if (target[path] != attr) target[path] = attr
    }
    if (!(path in target)) sync(target.getAttribute(path))
  }


  let value = target[path],
      get = orig && orig.get || (() => value),
      set = orig && orig.set ? v => (orig.set.call(target, v), channel.push(get())) : v => channel.push(value = v)
  if (!orig || orig.configurable && !(path in proto)) {
    Object.defineProperty(target, path, {
      configurable: true,
      enumerable: true,
      get,
      set
    })
    channel.subscribe(value => attr(target, path, value), null, () => {
      Object.defineProperty(target, path, orig || { value, configurable: true })
    })
  }

  // set attribute observer
  if (target.setAttribute) {
    const mo = new MutationObserver((records) => records.map(rec => sync(target.getAttribute(path))))
    mo.observe(target, { attributes: true, attributeFilter: [path] })
    channel.subscribe(null, null, () => mo.disconnect())
  }


  Object.defineProperties(fn, {
    valueOf: desc(get),
    toString: desc(get),
    [Symbol.toPrimitive]: desc(get),
    [symbol.observable]: desc(() => channel),
    [symbol.dispose]: desc(channel.close),
    [Symbol.asyncIterator]: desc(async function*() {
      let resolve = () => {}, buf = [], p,
      unsubscribe = fn(v => (
        buf.push(v),
        resolve(),
        p = new Promise(r => resolve = r)
      ))
      try {
        while (1) {
          yield* buf.splice(0)
          await p
        }
      } catch {
      } finally {
        unsubscribe()
      }
    })
  })

  return fn
}

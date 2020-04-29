import { desc, channel as Channel, observer, symbol, attr } from './src/util.js'


export default function a(target, path) {
  const channel = Channel()

  function fn () {
    if (channel.closed) return
    if (!arguments.length) return get()
    if (observer(...arguments)) {
      let unsubscribe = channel.subscribe(...arguments)
      channel.push.call(channel.observers.slice(-1), get())
      return unsubscribe
    }
    return set(...arguments)
  }

  const proto = Object.getPrototypeOf(target)
  const orig = Object.getOwnPropertyDescriptor(target, path)

  let value = target[path],
      get = orig && orig.get || (() => value),
      set = orig && orig.set ? v => (orig.set.call(target, v), channel.push(get())) : v => channel.push(value = v)
  if (!orig || orig.configurable) {
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
    const mo = new MutationObserver((records) => records.map(() => sync(target.getAttribute(path))))
    mo.observe(target, { attributes: true, attributeFilter: [path] })
    channel.subscribe(null, null, () => mo.disconnect())

    function sync (attr) {
      attr = attr === '' ? true : attr
      // own HTMLElement prototype props (like style, onxxx, class etc.) are expected to react themselves on attr update
      if (path in proto) return channel.push(target[path])
      if (target[path] != attr) target[path] = attr
    }

    sync(target.getAttribute(path))
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
          while (buf.length) yield buf.shift()
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

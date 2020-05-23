import { attr } from './src/util.js'
import Channel from './src/channel.js'

export default function a(target, path) {
  const proto = Object.getPrototypeOf(target),
        orig = Object.getOwnPropertyDescriptor(target, path),
        get = orig && orig.get || (() => value),
        set = orig && orig.set ? v => (orig.set.call(target, v), channel.push(get())) : v => channel.push(value = v),
        channel = new Channel(get, set)

  let sync
  if (target.setAttribute) {
    sync = attr => {
      // own HTMLElement prototype props (like style, onxxx, class etc.) are expected to react themselves on attr update
      if (path in proto) return target[path] !== attr ? channel.push(target[path]) : null

      attr = attr === '' ? true : attr
      if (target[path] != attr) target[path] = attr
    }
    if (!(path in target)) sync(target.getAttribute(path))
  }

  let value = channel.current = target[path]

  if (!orig || orig.configurable && !(path in proto)) {
    Object.defineProperty(target, path, {
      configurable: true,
      enumerable: true,
      get, set
    })
    channel.subscribe(
      value => attr(target, path, value),
      null,
      () => Object.defineProperty(target, path, orig || { value, configurable: true })
    )
  }

  // set attribute observer
  if (target.setAttribute) {
    const mo = new MutationObserver((records) => records.map(rec => sync(target.getAttribute(path))))
    mo.observe(target, { attributes: true, attributeFilter: [path] })
    channel.subscribe(null, null, () => mo.disconnect())
  }

  return channel.fn
}

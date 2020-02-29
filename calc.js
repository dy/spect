import bus from './src/bus.js'
import fx from './fx.js'

export default function calc(fn, deps) {
  let channel = bus(() => {
    if (changed) {
      value = fn(...changed)
      changed = null
    }
    return value
  }), value, changed

  let fxc = fx((...args) => {
    changed = null
    channel(value = fn(...args))
  }, deps)

  // sync channel to track sync getter
  fxc.subscribe((args) => changed = args)

  return channel
}


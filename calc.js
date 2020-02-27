import bus from './src/bus.js'
import fx from './fx.js'

export default function calc(fn, deps) {
  let channel = bus(() => value), value

  fx((...args) => {
    channel(value = fn(...args))
  }, deps)

  return channel
}

import bus, { _bus } from './src/bus.js'
import from from './src/from.js'

export default function fx(callback, deps=[]) {
  deps = deps.map(from)

  const channel = bus(), current = deps.map(dep => dep())
  let changed = null, destroy

  const notify = (v) => {
    channel(current)
    if (changed) return changed

    // extra tick to skip sync deps
    return changed = Promise.resolve().then().then().then().then(() => {
      changed = null
      if (destroy && destroy.call) destroy()
      destroy = callback(...current)
    })
  }

  deps.map((from, i) => from.subscribe(value => {
    notify(current[i] = value, i)
  }))

  // instant run, if there are immediate inputs
  if (!deps.length || current.some(value => value != null)) {
    destroy = callback(...current)
  }

  return channel
}

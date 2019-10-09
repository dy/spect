import { run } from './core'

export default function fx(fn) {
  let destroy

  // FIXME: async effects naturally resolve circular dependencies
  run(() => {
    if (destroy && destroy.call) destroy()
    destroy = fn()
  })

  // TODO
  // return () => unsubscribe(fn)
}

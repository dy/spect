import { run, unsubscribe } from './core'

export default function fx(fn) {
  let destroy

  run(() => {
    if (destroy && destroy.call) destroy()
    destroy = fn()
  })

  return () => unsubscribe(fn)
}

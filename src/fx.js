import { deps as checkDeps } from './core'
import { isIterable } from 'core-js'

export default function fx(deps, fn) {
  if (typeof deps === 'function') {
    fn = deps
    deps = null
  }

  let destroy
  if (!checkDeps(deps, () => destroy && destroy.call && destroy.call())) return
  if (!isIterable(deps)) deps = [deps]
  destroy = fn(...deps)

  return
}

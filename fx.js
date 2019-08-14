import { fx as _fx } from './src/core.js'

export default function fx (fn, deps) {
  return _fx.call(this, 'fx', fn, deps)
}

import { queue } from './core'

export default function fx(fn) {
  queue(fn)
}

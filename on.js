import ref, { _p } from './ref.js'

export default function on (el, event) {
  let last = ref()

  Object.assign(last, {
    // no initial value notification
    async * [Symbol.asyncIterator]() {
      try {
        while (1) {
          await last[_p]
          yield last.get()
        }
      } catch (e) {
      } finally {
      }
    }
  })

  el.addEventListener(event, e => last(e))

  return last
}

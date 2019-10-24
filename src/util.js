import kebab from 'kebab-case'

const cancelled = {}
export function setMicrotask (fn, ctx) {
  let sym = Symbol('microtask')
  Promise.resolve().then(() => {
    if (cancelled[sym]) return
    delete cancelled[sym]
    fn()
  })
  return sym
}
export function clearMicrotask (sym) {
  cancelled[sym] = true
}

export const SPECT_CLASS = '👁'

export function isIterable(val) {
  if (isPrimitive(val)) return false
  if (val instanceof Node) return false
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export function isPrimitive(val) {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
}

export function isElement (arg) {
  return typeof arg === 'object' && arg && 'ownerDocument' in arg
}

export function isRenderable (arg) {
  if (arg === undefined) return false
  return arg === null || isPrimitive(arg) || Array.isArray(arg) || isElement(arg)
}

export function flat (arg) {
  let result = [...arg]
  return result.map(el => isIterable(arg) ? flat(arg) : arg).flat()
}


// polyfill readable stream iterator
export const ReadableStream = window.ReadableStream && window.ReadableStream.prototype[Symbol.asyncIterator] ?
  window.ReadableStream : (() => {
  function ReadableStream (...args) {
    let readers = []
    let obj = args[0]

    let stream = new window.ReadableStream(...args)

    // patch cancel to release lock
    let _cancel = stream.cancel
    stream.cancel = function cancel(...args) {
      readers.forEach(reader => {
        reader.cancel()
        reader.releaseLock()
      })
      readers.length = 0
      _cancel.call(this, ...args)
    }

    stream[Symbol.asyncIterator] =
    stream.getIterator = function () {
      const reader = stream.getReader()
      readers.push(reader)

      return {
        next() {
          return reader.read()
        },
        return() {
          readers.splice(readers.indexOf(reader), 1)
          reader.releaseLock()
          return {}
        },
        [Symbol.asyncIterator]() {
          return this
        }
      };
    }
    return stream
  }

  return ReadableStream
})()


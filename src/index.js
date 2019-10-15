import on from './on'
import fx from './fx'
import $ from './$'
import attr from './attr'
// import state from './state'
// import cls from './class'
import prop from './prop'
// import local from './local'
// import data from './data'
// import query from './query'
import html from './html'

export {
  attr,
  // local,
  // data,
  // query,
  $,
  on,
  // state,
  fx,
  prop,
  html,
  // cls
}


// polyfill readable stream iterable
let readableProto = ReadableStream.prototype
if (!readableProto.getIterator) {
  let iteratorCache = new WeakMap

  readableProto.getIterator =
    readableProto[Symbol.asyncIterator] = function getIterator({ preventCancel = false } = {}) {
      const reader = this.getReader()
      const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
      iterator._asyncIteratorReader = reader;
      iterator._preventCancel = Boolean(preventCancel);
      iteratorCache.set(this, reader)

      return iterator;
    }

  let _cancel = readableProto.cancel
  readableProto.cancel = function cancel(...args) {
    let reader = iteratorCache.get(this)
    reader.cancel()
    reader.releaseLock()
    _cancel.call(this, ...args)
    iteratorCache.delete(this)
  }
}

const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () { }).prototype);
const ReadableStreamAsyncIteratorPrototype = Object.setPrototypeOf({
  next() {
    const reader = this._asyncIteratorReader
    return reader.read()
  },

  return(value) {
    reader.releaseLock()
    return { value, done: true }
  }
}, AsyncIteratorPrototype);
Object.defineProperty(ReadableStreamAsyncIteratorPrototype, 'next', { enumerable: false });
Object.defineProperty(ReadableStreamAsyncIteratorPrototype, 'return', { enumerable: false });



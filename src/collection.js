import { uid, isIterable, isObject } from './util.js'
import { effects } from './index.js'

const cache = new WeakMap

const setCache = new WeakMap,
      queueCache = new WeakMap



// proxy wrapper, just in case
function wrap($els) {
  return new Proxy($els, handler)
}

const handler = {
  get(target, prop, receiver) {
    // $els[0]
    if (!Number.isNaN(Number(prop))) return target.item(index)

    // $els.then
    if (prop === 'then') return target.p.then

    // $els.effect
    // FIXME: should it be cached? bind is fast though
    if (effects[prop]) {
      return effects[prop].bind(receiver)
    }

    // $els.*
    return Reflect.get(target, prop, receiver)
  },

  // $els(???)
  // apply(target, thisArg, args) {
  //   xxx
  //   // return $(args[0], target)
  // }
}

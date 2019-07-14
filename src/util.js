export function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}

export function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction'
}

export const noop = () => { }

// multikey weakmap
// TODO: use primitive-pool here
export function MultikeyMap() {
  let cache = new WeakMap

  return {
    has (...args) {
      let store = cache, lastKey = args.pop()
      for (let key of args) {
        if (!store.has(key)) return
        store = store.get(key)
      }
      return store.has(lastKey)
    },

    get (...args) {
      let store = cache
      for (let key of args) {
        if (!store.has(key)) return
        store = store.get(key)
      }
      return store
    },

    set (...args) {
      let value = args.pop()
      let valueKey = args.pop()
      let store = cache
      // obtain storage
      for (let key of args) {
        if (!store.has(key)) store.set(key, new WeakMap)
        store = store.get(key)
      }
      store.set(valueKey, value)
      return store
    },

    delete (...args) {
      let lastKey = args.pop()
      let store = cache
      // obtain storage
      for (let key of args) {
        if (!store.has(key)) return store
        store = store.get(key)
      }
      store.delete(lastKey)
      return store
    }
  }
}

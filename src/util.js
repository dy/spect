export function isObject(x) {
  return  typeof obj === 'object'
    && obj !== null
    && obj.constructor === Object
    && Object.prototype.toString.call(obj) === '[object Object]';
}

export function h (str, props) {
  if (str.raw) str = String.raw.call(String, str, props)

  let [tagName, id] = str.split('#')

  let classes
  if (id) {
    classes = id.split('.')
    id = classes.shift()
  }
  else {
    classes = tagName.split('.')
    tagName = classes.shift()
  }


  let el = document.createElement(tagName)

  if (id) el.setAttribute('id', id)
  if (classes.length) el.classList.add(...classes)

  if (props) for (let name in props) el.setAttribute(name, props[name])

  return el
}

export function isAsync (fn) {
  return fn.constructor.name === 'AsyncFunction'
}


// multikey weakmap
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
      return value
    }
  }
}

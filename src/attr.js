const cache = new WeakMap

export default function attr(el, name, callback) {
  if (!name) throw Error('`attr` expects attribute name to observe')

  let resolve, p = new Promise(ok => resolve = ok)

  let observer = cache.get(el)
  if (!observer) {
    cache.set(el, observer = new MutationObserver(records => {
      for (let i = 0, length = records.length; i < length; i++) {
        let { target, attributeName, oldValue } = records[i];
        let value = target.getAttribute(attributeName)
        if (Object.is(oldValue, value)) continue
        callback && callback(value)
        resolve({ value })
        p = new Promise(ok => resolve = ok)
        handle.then = p.then.bind(p)
      }
    }))
    observer.attributeNames = new Set()
  }

  if (!observer.attributeNames.has(name)) {
    observer.attributeNames.add(name)

    // observer is singleton, so this redefines previous command
    observer.observe(el, { attributes: true, attributeFilter: [...observer.attributeNames], attributeOldValue: true })
  }


  let handle = {
    end() {
      handle.done = true
      observer.attributeNames.delete(name)
      observer.observe(el, { attributes: true, attributeFilter: [...observer.attributeNames], attributeOldValue: true })
    },
    [Symbol.asyncIterator]() {
      return {
        i: 0,
        next() {
          if (handle.done) return { done: true }
          this.i++
          return p
        },
        return() {
          handle.end()
        }
      }
    },
    done: false,
    then: p.then.bind(p)
  }

  // initial value
  Promise.resolve().then(() => {
    let value = el.getAttribute(name)
    callback && callback(value)
    resolve({ value })
    p = new Promise(ok => resolve = ok)
    handle.then = p.then.bind(p)
  })

  return handle
}

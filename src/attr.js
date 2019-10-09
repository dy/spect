const cache = new WeakMap

export default function attr(el, name) {
  if (!name) throw Error('`attr` expects attribute name to observe')

  let resolve, p = new Promise(ok => resolve = ok)

  let observer = cache.get(el)
  if (!observer) {
    cache.set(el, observer = new MutationObserver(records => {
      for (let i = 0, length = records.length; i < length; i++) {
        let { target, attributeName, oldValue } = records[i];
        let currentValue = target.getAttribute(attributeName)
        if (Object.is(oldValue, currentValue)) continue

        resolve(currentValue)
        p = new Promise(ok => resolve = ok)
      }
    }))
    observer.attributeNames = new Set()
    observer.asyncGen = async function* () {
      while (true) {
        yield p
      }
    }
  }
  if (!observer.attributeNames.has(name)) {
    observer.attributeNames.add(name)

    // observer is singleton, so this redefines previous command
    observer.observe(el, { attributes: true, attributeFilter: [...observer.attributeNames], attributeOldValue: true })
  }

  return observer.asyncGen
}

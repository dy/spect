const cache = new WeakMap

export default function attr(el, name, callback) {
  if (!name) throw Error('`attr` expects attribute name to observe')

  let controllers = {}
  let observer = cache.get(el)
  if (!observer) {
    cache.set(el, observer = new MutationObserver(records => {
      let enqueued = {}
      for (let i = 0, length = records.length; i < length; i++) {
        let { target, attributeName, oldValue } = records[i];
        let value = target.getAttribute(attributeName)
        if (!controllers[name]) continue
        if (enqueued[name] === value) continue
        if (Object.is(oldValue, value)) continue
        enqueued[name] = value
        controllers[name].forEach(controller => controller.enqueue(value))
      }
    }))
    observer.attributeNames = new Set()
  }

  if (!observer.attributeNames.has(name)) {
    observer.attributeNames.add(name)

    // observer is singleton, so this redefines previous command
    observer.observe(el, { attributes: true, attributeFilter: [...observer.attributeNames], attributeOldValue: true })
  }

  let streamController

  return new ReadableStream({
    start(controller) {
      (controllers[name] || (controllers[name] = [])).push(controller)
      controller.enqueue(el.getAttribute(name))
      streamController = controller
    },
    pull(controller) {
    },
    cancel(reason) {
      this.done = true
      observer.attributeNames.delete(name)
      observer.observe(el, { attributes: true, attributeFilter: [...observer.attributeNames], attributeOldValue: true })
      controllers[name].splice(controllers[name].indexOf(streamController), 1)
    }
  })
}

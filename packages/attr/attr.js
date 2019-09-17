

attr: createEffect('attr',
  function (...args) {
    return this[0].getAttribute(String.raw(...args))
  },
  el => {
    let obj = {}
    for (let attr of el.attributes) obj[attr.name] = attr.value
    return obj
  },
  (el, name) => {
    if (!attrObserverCache.has(el)) {
      let observer = new MutationObserver(records => {
        for (let i = 0, length = records.length; i < length; i++) {
          let { target, oldValue, attributeName } = records[i];
          updateObservers(target, 'attr', attributeName)
        }
      })
      observer.observe(el, { attributes: true })
      attrObserverCache.set(el, observer)
    }
    if (!el.hasAttribute(name)) return false
    if (el.getAttribute(name) === '') return true
    return el.getAttribute(name)
  },
  (el, name, value) => {
    if (value === true && !el.hasAttribute(name)) el.toggleAttribute(name)
    else if ((value === false || value == null) && el.hasAttribute(name)) el.removeAttribute(name)
    else el.setAttribute(name, value)
  },
  (a, b) => b + '' === a + ''
),

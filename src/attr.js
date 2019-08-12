import { $, SET, GET } from './$.js'


// attribute listens for read attributes from elements and modifies set of observed attributes via mutation observer


const targetCache = new WeakMap
Object.defineProperty($.fn, 'attr', {
  get() {
    if (!targetCache.has(this)) targetCache.set(this, createAttr(this))
    return targetCache.get(this)
  },

  set(value) {
    console.log('TODO set attr', this)
  }
})


const attrCache = new WeakMap
function createAttr($el) {
  let firstEl = $el[0]

  return new Proxy({}, {
    set: (_, name, value) => {
      $el.forEach(el => {
        let prev = el.getAttribute(name)

        // skip unchanged value
        if (Object.is(prev, value)) return

        el.setAttribute(name, value)

        $.publish(SET, el, ['attr', name], value, prev)
      })

      return true
    },

    get: (_, namr) => {
      // FIXME: what about nested props access/writing?

      // return first element state value
      $.publish(GET, firstEl, ['attr', namr])

      return firstEl.getAttribute(namr)
    }
  })
}



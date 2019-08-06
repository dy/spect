// FIXME: replace with primitive-pool WeakMap
// this cache is for faster fetching static targets' aspects
export const targetsCache = new Map


// aspect === [node, fn] tuple
// $ is collections handler, eventually attaching wrappers for set of elements to attach effects
export default function $(arg, ...args) {
  // h case $(tag, props, ...children)
  if (args.length) {
    let vdom = html.h(arg, ...args)
    return $(document.createDocumentFragment()).html(arg, ...args)
  }

  if (typeof arg === 'string') {
    arg = arg.trim()

    // html case $`<></>`
    if (arg[0] === '<') {
      return $(document.createDocumentFragment()).html(arg, ...args)
    }

    arg = document.querySelector(arg)
  }

  // $(el|frag|text|node)
  if (arg instanceof Node) {
    if (!targetsCache.has(arg)) targetsCache.set(arg, new Spect(arg))
    return targetsCache.get(arg)
  }

  throw Error('Collections are unimplemented for now.')

  // selector can select more nodes than before, so
  if (!targetsCache.has(arg)) targetsCache.set(arg, [])

  let collection = targetsCache.get(arg)

  // selector can query new els set, so we update the list
  if (typeof arg === 'string') {
    arg = document.querySelectorAll(arg)
  }

  // nodelist/array could have changed, so make sure new els are in the list
  // FIXME: that can be done faster
  collection.length = 0


  return collection
}

function Spect (...args) {
  this.nodes = args
}

// Proxy prototype for collection provides:
// a. negative array indexes
// b. transparent mapping of effect call to all elements in collection

Spect.prototype = new Proxy({}, {
  get: function (target, key, receiver) {
    console.log(`getting ${key}!`);
    return Reflect.get(target, key, receiver);
  },
  set: function (target, key, value, receiver) {
    registerEffect(target, key, value)
    return true
  }
})

function registerEffect(target, name, value) {
  // turn value into callable
  if (typeof value !== 'function') {
    value = new Proxy(value, {
      apply: (...args) => {
        console.log('call', this)
        // this.nodes.forEach(el => Reflect.apply(...args))
      }
    })
  }

  Object.defineProperty(target, name, {
    get () {
      console.log('get', name, this)
      // return Reflect.get(this.nodes[0], name)
    },
    set (value) {
      console.log('set', this)
      // this.nodes.forEach(node => Reflect.set(node, name, value))
    }
  })
}

// FIXME: useful as external lib
function broadcast(target, key, value, receiver) {
  // define property on holder so that any interaction with that broadcasts method to all values in the set
}


export { $ }
export const fn = $.fn = Spect.prototype

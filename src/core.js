import equal from 'fast-deep-equal'
import { parse as parseStack } from 'stacktrace-parser'


// used to turn stacktrace-based effects, opposed to fxCount
const isStacktraceAvailable = !!(new Error).stack

const sQueue = Symbol('queue')
const sPromise = Symbol('promise')
const sUse = Symbol('use')
const sSubscription = Symbol('subscription')
const sBound = Symbol('bound')
const sProxy = Symbol('proxy')

const cache = new WeakMap

let fxCount, current = null

// effect-able holder / target wrapper
export default function Spect(arg) {
  if (arg instanceof Spect) return arg
  if (cache.has(arg)) return cache.get(arg)

  if (!(this instanceof Spect)) return new Spect(arg)

  let spect = this

  this[sQueue] = new Set
  this[sPromise] = Promise.resolve()
  this[sUse] = new Map
  this[sSubscription] = {}
  this[sBound] = new WeakMap
  this[sProxy] = new Proxy(arg, {
    get(target, name) {
      if (spect[name]) return spect[name]
      return target[name]
    },
    getPrototypeOf(target) {
      return Spect.prototype
    }
  })

  cache.set(arg, this[sProxy])
  return this[sProxy]
}

Spect.prototype = {
  then(fn) {
    return this[sPromise].then(fn)
  },

  // plan fn to run with target context
  queue(fn) {
    let q = this[sQueue], p = this[sPromise], px = this[sProxy]
    if (!q.size) p.then(() => {
      for (let fn of q) fn.call(px, px)
      q.clear()
    })
    q.add(fn)
    return px
  },

  use(...fns) {
    let use = this[sUse]

    fns.forEach(fn => {
      if (!use.has(fn)) {
        let boundFn = fn.bind(this)
        boundFn.fn = fn
        boundFn.target = this
        boundFn.deps = {}
        boundFn.destroy = {}
        use.set(fn, boundFn)
        this.queue(() => this.run(boundFn))
      }
    })

    return this[sProxy]
  },

  run(fn) {
    let px = this[sProxy]

    if (!fn) {
      for (let [, fn] of this[sUse]) this.run(fn)
      return px
    }

    if (!fn.fn) {
      if(!this[sUse].has(fn)) throw Error('Unknown aspect `' + fn.name + '`')
      fn = this[sUse].get(fn)
    }

    this.queue(() => {
      let prev = current
      fxCount = 0
      current = fn
      fn(px)
      current = prev
    })

    return px
  },

  // subscribe target aspect to updates of the indicated path
  subscribe (name, aspect) {
    let subscriptions = this[sSubscription]
    if (!subscriptions[name]) subscriptions[name] = new Set()
    subscriptions[name].add(aspect)
  },

  // update effect observers
  publish (name) {
    let subscriptions = this[sSubscription]
    if (!subscriptions[name]) return
    let subscribers = subscriptions[name]
    for (let aspect of subscribers) aspect.target.run(aspect)
    return this
  }
}

// registering effect gives:
// - bound target
// - read-only effect
// - descriptor reading
// - [ideally] registering static plugin
export function registerEffect(name, descriptor) {
  const targetCache = new WeakMap

  let fn = typeof descriptor === 'function' ? descriptor(testDeps) : createEffect(name, descriptor)

  Object.defineProperty(Spect.prototype, name, {
    get() {
      let boundFn = targetCache.get(this)
      if (!boundFn) {
        targetCache.set(this, boundFn = fn.bind(this))
        boundFn.target = this
      }
      return boundFn
    },
    set() {
      throw Error('Effect `' + name + '` cannot be redefined.')
    }
  })
}

function createEffect(effectName, descriptor) {
  let {
    deps = true,
    reduce = true,
    template,
    getValues,
    getValue,
    setValue,
    setValues,
  } = descriptor

  return function effect(...args) {
    // effect()
    if (getValues) {
      if (!args.length) return getValues(this)
    }

    // effect`...`
    if (template) {
      if (args[0].raw) {
        return template(this, ...args)
      }
    }

    // effect(s => {...}, deps)
    if (reduce) {
      if (typeof args[0] === 'function') {
        if (deps) {
          let [, deps] = args
          if (!testDeps(deps)) return this
        }

        // custom reducer function
        if (typeof reduce === 'fn') {
          reduce(el, fn)
        }

        // default object-based reducer
        else {
          let [fn] = args
          let state = getValues(this)
          let result
          try {
            result = fn(new Proxy(state, { set: (target, prop, value) => {
              if (target[prop] !== value) this.publish(effectName + '.' + prop)
              return Reflect.set(target, prop, value)
            }}))
          } catch (e) { }

          if (result !== state && typeof result === typeof state) {
            setValues(this, result)
            for (let name in result) this.publish(effectName + '.' + name)
          }
        }

        return this
      }
    }

    // effect(name)
    if (getValue) {
      if (args.length == 1 && (typeof args[0] === 'string' )) {
        let [name] = args

        if (current) this.subscribe(effectName + '.' + name, current)

        return getValue(this, name)
      }
    }

    // effect(obj, deps)
    if (setValues) {
      if (typeof args[0] === 'object') {
        let [props] = args

        if (deps) {
          let [, deps] = args
          if (!testDeps(deps)) return this
        }

        setValues(this, props)
        for (let name in props) this.publish(effectName + '.' + name)

        return this
      }
    }

    // effect(name, value, deps)
    if (setValue) {
      if (args.length >= 2) {
        let [name, value, deps] = args
        if (!testDeps(deps)) return this

        let prev = getValue(this, name)
        if (equal(prev, value)) return this
        setValue(this, name, value)
        this.publish(effectName + '.' + name)
      }
    }

    return this
  }
}


// check if deps changed, call destroy
function testDeps(deps, destroy) {
  if (!current) return true

  let key
  if (isStacktraceAvailable) {
    let [testDepssite, effectsite, callsite, ...trace] = parseStack((new Error).stack)
    let callsiteurl = callsite.file + ':' + callsite.lineNumber + ':' + callsite.column
    key = callsiteurl
  }
  // fallback to react order-based key
  else {
    key = fxCount++
  }

  if (deps == null) {
    let prevDestroy = current.destroy[key]
    if (prevDestroy && prevDestroy.call) prevDestroy.call()
    current.destroy[key] = destroy
    return true
  }

  let prevDeps = current.deps[key]
  if (deps === prevDeps) return false
  if (Array.isArray(deps)) {
    if (equal(deps, prevDeps)) return false
  }
  current.deps[key] = deps

  // enter false state - ignore effect
  if (prevDeps === undefined && deps === false) return false

  let prevDestroy = current.destroy[key]
  if (prevDestroy && prevDestroy.call) prevDestroy()

  // toggle/fsm case
  if (deps === false) {
    current.destroy[key] = null
    return false
  }

  current.destroy[key] = destroy
  return true
}

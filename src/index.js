import equal from 'fast-deep-equal'
import { parse as parseStack } from 'stacktrace-parser'


const isStacktraceAvailable = !!(new Error).stack

const sPromise = Symbol('promise')
const sUse = Symbol('use')
const sSubscription = Symbol('subscription')
const sBound = Symbol('bound')
const sProxy = Symbol('proxy')
const sRun = Symbol('run')
const sPublish = Symbol('publish')
const sSubscribe = Symbol('subscribe')

const cache = new WeakMap

let fxCount, recurseCount
export let current = null

const MAX_DEPTH = 50

// effect-able holder / target wrapper
export default function Spect(arg) {
  if (cache.has(arg)) return cache.get(arg)

  if (!(this instanceof Spect)) return new Spect(arg)

  if (arg && arg[sUse]) return arg
  if (arg == null) arg = {}
  if (isPrimitive(arg)) arg = new (Object.getPrototypeOf(arg).constructor)(arg)

  let spect = this
  this[sPromise] = Promise.resolve()
  this[sUse] = new Map
  this[sSubscription] = {}
  this[sBound] = new WeakMap
  this[sProxy] = new Proxy(arg, {
    get(target, name) {
      if (spect[name]) return spect[name]
      return target[name]
    }
  })

  cache.set(arg, this[sProxy])
  return this[sProxy]
}

Spect.prototype = {
  [sRun](fn) {
    if (this.error) return

    let px = this[sProxy]

    if (!fn) {
      for (let [, fn] of this[sUse]) this[sRun](fn)
      return px
    }

    if (!fn.fn) {
      if (!this[sUse].has(fn)) throw Error('Unknown aspect `' + fn.name + '`')
      fn = this[sUse].get(fn)
    }

    this.then(async () => {
      let prev = current
      fxCount = 0
      current = fn
      await fn(px)
      current = prev
      return px
    })

    if (!recurseCount) {
      recurseCount = 1
      this.then(() => {
        recurseCount = 0
        return px
      })
    } else {
      recurseCount++
      if (recurseCount > MAX_DEPTH) {
        this.error = true
        throw Error('Recursion')
      }
    }

    return px
  },

  // subscribe target aspect to updates of the indicated path
  [sSubscribe](name, aspect = current) {
    if (!aspect) return this[sProxy]
    let subscriptions = this[sSubscription]
    if (!subscriptions[name]) subscriptions[name] = new Set()
    subscriptions[name].add(aspect)
    return this[sProxy]
  },

  // update effect observers
  [sPublish](name) {
    let subscriptions = this[sSubscription]
    if (!subscriptions[name]) return
    let subscribers = subscriptions[name]
    for (let aspect of subscribers) aspect.target[sRun](aspect)
    return this[sProxy]
  }
}

Object.defineProperty(Spect.prototype, 'then', {
  get() {
    if (this.blocked) return null
    return (fn) => {
      this[sPromise].then(() => {
        this.blocked = true
        fn(this[sProxy])
        return this[sProxy]
      })
      return this[sProxy]
    }
  }
})

Spect.registerEffect = function (...fxs) {
  fxs.forEach(descriptor => {
    const targetCache = new WeakMap

    const name = descriptor.name

    if (!name) throw Error('Effect must have `name` property')

    const fn = typeof descriptor === 'function' ? descriptor : createEffect(name, descriptor)

    Object.defineProperty(Spect.prototype, name, {
      get() {
        let boundFn = targetCache.get(this)
        if (!boundFn) {
          targetCache.set(this, boundFn = fn.bind(this))
          boundFn.target = this
        }
        return boundFn
      },
      set() {}
    })
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
      if (!args.length) {
        this[sSubscribe](effectName)
        return getValues(this)
      }
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
          if (!Spect.deps(deps)) return this
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
            result = fn(new Proxy(state, {
              set: (target, prop, value) => {
                if (target[prop] !== value) this[sPublish](effectName + '.' + prop)
                return Reflect.set(target, prop, value)
              }
            }))
          } catch (e) { }

          if (result !== state && typeof result === typeof state) {
            setValues(this, result)
            this[sPublish](effectName)
            for (let name in result) this[sPublish](effectName + '.' + name)
          }
        }

        return this
      }
    }

    // effect(name)
    if (getValue) {
      if (args.length == 1 && (typeof args[0] === 'string')) {
        let [name] = args

        this[sSubscribe](effectName + '.' + name)

        return getValue(this, name)
      }
    }

    // effect(obj, deps)
    if (setValues) {
      if (typeof args[0] === 'object') {
        let [props] = args

        if (deps) {
          let [, deps] = args
          if (!Spect.deps(deps)) return this
        }

        let prev = getValues(this)

        if (!equal(prev, props)) {
          setValues(this, props)
          this[sPublish](effectName)
          for (let name in props) this[sPublish](effectName + '.' + name)
        }

        return this
      }
    }

    // effect(name, value, deps)
    if (setValue) {
      if (args.length >= 2) {
        let [name, value, deps] = args
        if (!Spect.deps(deps)) return this

        let prev = getValue(this, name)
        if (equal(prev, value)) return this
        setValue(this, name, value)
        this[sPublish](effectName + '.' + name)
      }
    }

    return this
  }
}

// check if deps changed, call destroy
Spect.deps = (deps, destroy) => {
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
  if (!isPrimitive(deps)) {
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


const stateCache = new WeakMap
function getValues(el) {
  let state = stateCache.get(el)
  if (!state) stateCache.set(el, state = {})
  return state
}
Spect.registerEffect(
  function use(...fns) {
    let use = this[sUse]

    fns.forEach(fn => {
      if (!use.has(fn)) {
        let boundFn = fn.bind(this)
        boundFn.fn = fn
        boundFn.target = this
        boundFn.deps = {}
        boundFn.destroy = {}
        use.set(fn, boundFn)
        this[sRun](fn)
      }
    })

    return this[sProxy]
  },

  function run(fn, deps) {
    if (!Spect.deps(deps)) return this
    this[sRun](fn)
    return this[sProxy]
  },

  function fx(fn, deps) {
    if (!Spect.deps(deps, () => destroy.forEach(fn => fn && fn.call && fn()))) return this

    let destroy = []

    this.then(async () => destroy.push(await fn.call(this[sProxy])))

    return this
  },

  {
    name: 'state',
    getValues,
    getValue: (el, name) => getValues(el)[name],
    setValue: (el, name, value) => getValues(el)[name] = value,
    setValues: (el, obj) => Object.assign(getValues(el), obj),
    template: (el, ...args) => getValues(el)[String.raw(...args)]
  },

  {
    name: 'prop',
    template: (el, ...args) => el[String.raw(...args)],
    getValue: (el, name) => el[name],
    getValues: el => el,
    setValue: (el, name, value) => el[name] = value,
    setValues: (el, values) => Object.assign(el, values)
  }
)

function isPrimitive(arg) {
  try { new WeakSet([arg]); return false } catch (e) {
    return true
  }
}

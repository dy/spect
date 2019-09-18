import equal from 'fast-deep-equal'
import { parse as parseStack } from 'stacktrace-parser'
import { isPrimitive } from './util'

const isStacktraceAvailable = !!(new Error).stack

// hooks for effects
// since spect is proxy over target, it provides transparent access to target props
// therefore own props are hidden to avoid shading target props
// to avoid extra import, we use global symbols
const _promise = Symbol.for('spect.promise'),
      _use = Symbol.for('spect.use'),
      _subscription = Symbol.for('spect.subscription'),
      _proxy = Symbol.for('spect.proxy'),
      _target = Symbol.for('spect.target'),
      _publish = Symbol.for('spect.publish'),
      _subscribe = Symbol.for('spect.subscribe'),
      _update = Symbol.for('spect.update'),
      _using = Symbol.for('spect.using'),
      _dispose = Symbol.for('spect.dispose'),
      _deps = Symbol.for('spect.deps'),
      _error = Symbol.for('spect.error'),
      _instance = Symbol.for('spect.instance')

const cache = new WeakMap

let fxCount, recurseCount
export let current = null

const MAX_DEPTH = 50

export default function spect(arg) {
  return new Spect(arg)
}

class Spect {
  constructor(arg) {
    if (cache.has(arg)) return cache.get(arg)

    if (arg && arg[_use]) return arg
    if (arg == null) arg = {}
    if (isPrimitive(arg)) arg = new (Object.getPrototypeOf(arg).constructor)(arg)

    this[_target] = arg
    this[_promise] = Promise.resolve()
    this[_using] = new Map
    this[_subscription] = {}
    this[_instance] = this

    // FIXME: this should be whether polyfilled or ...
    this[Symbol.thenable] = false

    let self = this
    this[_proxy] = new Proxy(arg, {
      get(target, name, proxy) {
        if (self[name]) return self[name]
        return target[name]
      }
    })

    cache.set(arg, this[_proxy])
    return this[_proxy]
  }

  [_use](fn) {
    let px = this[_proxy]
    let using = this[_using]

    if (using.has(fn)) return px

    let boundFn = fn.bind(this[_proxy])
    boundFn.fn = fn
    boundFn.target = this[_proxy]
    boundFn.deps = {}
    boundFn.destroy = {}
    boundFn.children = new Set()

    // register child aspects
    if (current) current.children.add(boundFn)

    using.set(fn, boundFn)
    this[_update](fn)

    return px
  }

  [_update](fn) {
    let px = this[_proxy]

    if (this[_error]) return px

    if (!fn.fn) {
      if (!this[_using].has(fn)) {
        return this[_use](fn)
      }
      fn = this[_using].get(fn)
    }

    this[_promise].then(async () => {
      let prev = current
      fxCount = 0
      current = fn
      // FIXME: there can be a better way to handle errors than keeping as is
      try {
        fn.destructor = await fn(px)
      } catch (e) {
        console.error(e)
      }
      current = prev
      return px
    })

    if (!recurseCount) {
      recurseCount = 1
      this[_promise].then(() => {
        recurseCount = 0
        return px
      })
    } else {
      recurseCount++
      if (recurseCount > MAX_DEPTH) {
        this[_error] = Error('Recursion')
        throw this[_error]
      }
    }

    return px
  }

  [_dispose](fn) {
    let px = this[_proxy]

    if (!fn.fn) {
      if (!this[_using].has(fn)) return px
      fn = this[_using].get(fn)
    }

    // call planned effect destructors
    for (let key in fn.destroy) {
      let destroy = fn.destroy[key]
      destroy && destroy.call && destroy()
    }

    // destruct all child aspects
    for (let childfn of fn.children) {
      childfn.target[_dispose](childfn)
    }
    fn.children.clear()

    // call destructor
    if (fn.destructor) fn.destructor.call(px)

    fn.children = null
    fn.destructor = null
    fn.destroy = null
    fn.deps = null
    fn.target = null
    fn.fn = null

    // clear subscriptions
    for (let key in this[_subscription]) {
      this[_subscription][key].clear()
    }
    this[_subscription] = null

    // clean bound fns
    this[_using].clear()

    // FIXME: revoke proxy

    // remove arg from cache, if no aspects left
    cache.delete(this[_target])

    return px
  }

  // subscribe target aspect to updates of the indicated path
  [_subscribe](name, aspect = current) {
    if (!aspect) return this[_proxy]
    let subscriptions = this[_subscription]
    if (!subscriptions[name]) subscriptions[name] = new Set()
    subscriptions[name].add(aspect)
    return this[_proxy]
  }

  // update effect observers
  [_publish](name) {
    let subscriptions = this[_subscription]
    if (!subscriptions[name]) return
    let subscribers = subscriptions[name]
    for (let aspect of subscribers) aspect.target[_update](aspect)
    return this[_proxy]
  }

  // check if deps changed, call destroy
  [_deps](deps, destroy) {
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
      if (prevDestroy && prevDestroy.call) prevDestroy()
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

  then(fn) {
    this[_promise].then(fn)
    return this[_proxy]
  }
}

spect.fn = function registerEffect(...fxs) {
  fxs.forEach(fx => {
    const name = fx.name
    if (!name || name in Spect.prototype) return
    const cache = new WeakMap

    Object.defineProperty(Spect.prototype, name, {
      get() {
        let boundFn = cache.get(this[_proxy])
        if (!boundFn) {
          cache.set(this[_proxy], boundFn = fx.bind(this[_proxy]))
          boundFn.target = this[_proxy]
        }
        return boundFn
      },
      set() { }
    })
  })
}

/*
Object.defineProperty(Spect.prototype, 'then', {
  get() {

    let [protogetsite, proxygetsite, anonsite, queuesite, ...stack] = parseStack((new Error).stack)
    // FIXME: heuristic criteria to enable returning thenable from await
    if (!queuesite) return null

    if (
      // /anonymous function/.test(anonsite.methodName) &&
      // /Tick/.test(queuesite.methodName) &&
      /^internal/.test(queuesite.file) &&
      // /anonymous/.test(stack[stack.length - 1].methodName)
    ) {
      // console.log(parseStack((new Error).stack))
      return null
    }

    return (fn) => {
      // this[_promise].then(() => fn(this[_proxy]))
      this[_promise].then(() => fn())
      return this[_proxy]
    }
  }
})
*/

// core effects
spect.fn(function use(fns, deps) {
    if (!this[_deps](deps)) return this

    if (!Array.isArray(fns)) fns = [fns]

    fns.forEach(fn => this[_use](fn))

    return this
  },

  function update(fns, deps) {
    if (!this[_deps](deps)) return this

    if (!Array.isArray(fns)) {
      if (!fns) fns = [...this[_using].keys()]
      else fns = [fns]
    }

    fns.forEach(fn => this[_update](fn))

    return this
  },

  function dispose(fns, deps) {
    if (!this[_deps](deps)) return this

    if (!Array.isArray(fns)) {
      if (!fns) fns = [...this[_using].keys()]
      else fns = [fns]
    }

    fns.forEach(fn => this[_dispose](fn))

    return this
  }
)


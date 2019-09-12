import equal from 'fast-deep-equal'
import { parse as parseStack } from 'stacktrace-parser'


const isStacktraceAvailable = !!(new Error).stack

// available for effects
export const symbols = {
  promise: Symbol('promise'),
  aspects: Symbol('use'),
  subscription: Symbol('subscription'),
  proxy: Symbol('proxy'),
  target: Symbol('target'),
}

const cache = new WeakMap

let fxCount, recurseCount
export let current = null

const MAX_DEPTH = 50

export default function spect(arg) {
  return new Spect(arg)
}

// effect-able holder / target wrapper
class Spect {
  constructor(arg) {
    if (cache.has(arg)) return cache.get(arg)

    if (arg && arg[symbols.aspects]) return arg
    if (arg == null) arg = {}
    if (isPrimitive(arg)) arg = new (Object.getPrototypeOf(arg).constructor)(arg)

    this[symbols.target] = arg
    this[symbols.promise] = Promise.resolve()
    this[symbols.aspects] = new Map
    this[symbols.subscription] = {}

    let self = this
    this[symbols.proxy] = new Proxy(arg, {
      get(target, name) {
        if (self[name]) return self[name]
        return target[name]
      }
    })

    cache.set(arg, this[symbols.proxy])
    return this[symbols.proxy]
  }

  _run(fn) {
    let px = this[symbols.proxy]

    if (this.error) return px

    if (!fn) {
      for (let [, fn] of this[symbols.aspects]) this._run(fn)
      return px
    }

    if (!fn.fn) {
      if (!this[symbols.aspects].has(fn)) throw Error('Unknown aspect `' + fn.name + '`')
      fn = this[symbols.aspects].get(fn)
    }

    this[symbols.promise].then(async () => {
      let prev = current
      fxCount = 0
      current = fn
      await fn(px)
      current = prev
      return px
    })

    if (!recurseCount) {
      recurseCount = 1
      this[symbols.promise].then(() => {
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
  }

  // subscribe target aspect to updates of the indicated path
  _sub(name, aspect = current) {
    if (!aspect) return this[symbols.proxy]
    let subscriptions = this[symbols.subscription]
    if (!subscriptions[name]) subscriptions[name] = new Set()
    subscriptions[name].add(aspect)
    return this[symbols.proxy]
  }

  // update effect observers
  _pub(name) {
    let subscriptions = this[symbols.subscription]
    if (!subscriptions[name]) return
    let subscribers = subscriptions[name]
    for (let aspect of subscribers) aspect.target._run(aspect)
    return this[symbols.proxy]
  }

  // check if deps changed, call destroy
  _deps(deps, destroy) {
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
    this[symbols.promise].then(() => fn())
    return this[symbols.proxy]
  }
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
      // this[symbols.promise].then(() => fn(this[symbols.proxy]))
      this[symbols.promise].then(() => fn())
      return this[symbols.proxy]
    }
  }
})
*/

export function effect(...fxs) {
  fxs.forEach(descriptor => {
    const name = descriptor.name

    if (!name) return

    const cache = new WeakMap

    const fn = typeof descriptor === 'function' ? descriptor : createEffect(name, descriptor)

    Object.defineProperty(Spect.prototype, name, {
      get() {
        let boundFn = cache.get(this[symbols.proxy])
        if (!boundFn) {
          cache.set(this[symbols.proxy], boundFn = fn.bind(this[symbols.proxy]))
          boundFn.target = this[symbols.proxy]
        }
        return boundFn
      },
      set() { }
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
    let px = this[symbols.proxy]

    // effect()
    if (getValues) {
      if (!args.length) {
        this._sub(effectName)
        return getValues(this[symbols.target])
      }
    }

    // effect`...`
    if (template) {
      if (args[0].raw) {
        return template(this[symbols.target], ...args)
      }
    }

    // effect(s => {...}, deps)
    if (reduce) {
      if (typeof args[0] === 'function') {
        if (deps) {
          let [, deps] = args
          if (!this._deps(deps)) return px
        }

        // custom reducer function
        if (typeof reduce === 'fn') {
          reduce(el, fn)
        }

        // default object-based reducer
        else {
          let [fn] = args
          let state = getValues(this[symbols.target])
          let result
          try {
            result = fn(new Proxy(state, {
              set: (target, prop, value) => {
                if (target[prop] !== value) this._pub(effectName + '.' + prop)
                return Reflect.set(target, prop, value)
              }
            }))
          } catch (e) { }

          if (result !== state && typeof result === typeof state) {
            setValues(this[symbols.target], result)
            this._pub(effectName)
            for (let name in result) this._pub(effectName + '.' + name)
          }
        }

        return px
      }
    }

    // effect(name)
    if (getValue) {
      if (args.length == 1 && (typeof args[0] === 'string')) {
        let [name] = args

        this._sub(effectName + '.' + name)

        return getValue(this[symbols.target], name)
      }
    }

    // effect(obj, deps)
    if (setValues) {
      if (typeof args[0] === 'object') {
        let [props] = args

        if (deps) {
          let [, deps] = args
          if (!this._deps(deps)) return px
        }

        let prev = getValues(this[symbols.target])

        if (!equal(prev, props)) {
          setValues(this[symbols.target], props)
          this._pub(effectName)
          for (let name in props) this._pub(effectName + '.' + name)
        }

        return px
      }
    }

    // effect(name, value, deps)
    if (setValue) {
      if (args.length >= 2) {
        let [name, value, deps] = args
        if (!this._deps(deps)) return px

        let prev = getValue(this[symbols.target], name)
        if (equal(prev, value)) return px
        setValue(this[symbols.target], name, value)
        this._pub(effectName + '.' + name)
      }
    }

    return px
  }
}

// core effects
effect(
  function use(...fns) {
    let use = this[symbols.aspects]

    fns.forEach(fn => {
      if (!use.has(fn)) {
        let boundFn = fn.bind(this[symbols.proxy])
        boundFn.fn = fn
        boundFn.target = this[symbols.proxy]
        boundFn.deps = {}
        boundFn.destroy = {}
        use.set(fn, boundFn)
        this._run(fn)
      }
    })

    return this
  },

  function run(fn, deps) {
    if (!this._deps(deps)) return this[symbols.proxy]
    this._run(fn)
    return this
  }
)


function isPrimitive(arg) {
  try { new WeakSet([arg]); return false } catch (e) {
    return true
  }
}

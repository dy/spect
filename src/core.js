import equal from 'fast-deep-equal'
import { parse as parseStack } from 'stacktrace-parser'
import tuple from 'immutable-tuple'


// used to turn stacktrace-based effects, opposed to fxCount
const isStacktraceAvailable = !!(new Error).stack

const spectCache = new WeakMap,
  qCache = new WeakMap,
  pCache = new WeakMap,
  aspectCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  subscriptionCache = new WeakMap

let fxCount, fxId
let current

// effect-able holder / target wrapper
export default function spect(...args) {
  return new Spect(...args)
}

class Spect {
  constructor(arg, ...args) {
    super()

    // FIXME: should cache have invalidation?
    if (arg instanceof Spect) return arg
    if (spectCache.has(arg)) return spectCache.get(arg)

    // planned aspects/effects to rerender
    qCache.set(this, new Set)

    // promise per collection (microtask)
    pCache.set(this, Promise.resolve())

    spectCache.set(arg, this)

    return this
  }

  then(fn) {
    return pCache.get(this).then(fn)
  }

  // plan fn to run with target context
  queue(fn) {
    let q = qCache.get(this), p = pCache.get(this)
    if (!q.size) p.then(() => {
      for (let fn of q) fn.call(this, this)
      q.clear()
    })
    q.add(fn)
    return this
  }

  // run aspect, switch global context
  call(aspect) {
    let prev = current
    fxCount = 0
    current = tuple(this, aspect)
    aspect.call(this, this)
    current = prev
    return this
  }

  // subscribe target to updates of the indicated path
  subscribe (name, target, aspect) {
    if (!subscriptionCache.has(this)) subscriptionCache.set(this, {})
    let subscriptions = subscriptionCache.get(this)

    if (!subscriptions[name]) subscriptions[name] = new Set(tuple(target, aspect))
    else subscriptions[name].add(tuple(target, aspect))
  }

  // update effect observers
  publish (name) {
    if (!subscriptionCache.has(this)) return

    let subscriptions = subscriptionCache.get(this)
    if (!subscriptions[name]) return

    let subscribers = subscriptions[name]
    for (let [target, aspect] of subscribers) {
      target.update(aspect)
    }

    return this
  }
}

// register aspect
registerEffect('use', function (...fns) {
  let aspects = aspectCache.get(this)
  if (!aspects) aspectCache.set(this, aspects = [])

  fns.forEach(fn => {
    if (aspects.indexOf(fn) < 0) {
      aspects.push(fn)
      this.queue(() => this.call(fn))
    }
  })

  return this
})

// rerender all aspects
registerEffect('update', function (aspect) {
  let aspects = aspectCache.get(this)
  if (!aspects) return

  if (aspect) {
    if(aspects.indexOf(aspect) >=0 ) this.call(aspect)
    return this
  }

  aspects.forEach(aspect => this.queue(() => this.call(aspect)))

  return this
})

// registering effect gives:
// - bound target
// - read-only effect
// - descriptor reading
// - [ideally] registering static plugin
export function registerEffect(name, descriptor) {
  const targetCache = new WeakMap
  if (typeof descriptor === 'function') descriptor = descriptor()

  let fn = createEffect(name, descriptor)

  Object.defineProperty(Spect.prototype, name, {
    get() {
      let boundFn = targetCache.get(this)
      if (!boundFn) targetCache.set(this, boundFn = fn.bind(this))
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
          if (!testDeps(effectName, deps)) return this
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
            result = fn(state)
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
          if (!testDeps(effectName, deps)) return this
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
        if (!testDeps(effectName, deps)) return this

        let prev = getValue(this, name)
        if (is(prev, value)) return this
        setValue(this, name, value)
        this.publish(effectName + '.' + name)
      }
    }

    return this
  }
}

// check if deps changed, call destroy
function testDeps(name, deps, destroy) {
  let key = fxKey(name)

  if (deps == null) {
    if (destroyCache.has(key)) {
      let prevDestroy = destroyCache.get(key)
      if (prevDestroy && prevDestroy.call) prevDestroy.call()
    }
    destroyCache.set(key, destroy)

    return true
  }

  let prevDeps = depsCache.get(key)
  if (deps === prevDeps) return false
  if (Array.isArray(deps)) {
    if (equal(deps, prevDeps)) return false
  }
  depsCache.set(key, deps)

  // enter false state - ignore effect
  if (prevDeps === undefined && deps === false) return false

  if (destroyCache.has(key)) {
    let prevDestroy = destroyCache.get(key)
    if (prevDestroy && prevDestroy.call) prevDestroy()
  }

  // toggle/fsm case
  if (deps === false) {
    destroyCache.set(key, null)
    return false
  }

  destroyCache.set(key, destroy)
  return true
}

// get current effect call identifier, considering callstack
function fxKey(fxName) {
  let key

  // precompiled bundle inserts unique fxid before effect calls
  if (fxId) {
    key = tuple(current, fxName, fxId)
    fxId = null
  }
  else {
    // stacktrace key is precise for
    if (isStacktraceAvailable) {
      // FIXME: exact stack is susceptible to babel-ish transforms
      let [fxKeysite, testDepssite, fxsite, callsite, ...trace] = parseStack((new Error).stack)
      let callsiteurl = callsite.file + ':' + callsite.lineNumber + ':' + callsite.column
      key = tuple(current, fxName, callsiteurl)
    }
    // fallback to react order-based key
    else {
      key = tuple(current, fxName, fxCount++)
    }
  }

  return key
}

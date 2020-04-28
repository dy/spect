import { desc, channel as c, observer, immutable, observable, symbol } from './src/util.js'

const depsCache = new WeakMap

export default function v(source, ...fields) {
  if (source && source.raw) {
    return v(fields, fields => String.raw({raw: source.raw}, ...fields))
  }
  const [map=v=>v, unmap=v=>v] = fields
  const channel = c(), { subscribe, observers, error } = channel

  const push = (v, dif) => {
    if (v && v.then) v.then(push)
    else channel.push(channel.current = v, dif)
  }

  function fn (...args) {
    if (!args.length) return get()
    if (observer(...args)) {
      let unsubscribe = subscribe(...args)
      // callback is registered as the last channel subscription, so send it immediately as value
      if ('current' in channel) channel.push.call(observers.slice(-1), get(), get())
      return unsubscribe
    }
    return set(...args)
  }

  // current is mapped value (map can be heavy to call each get)
  let get = () => channel.current
  let set = (val, dif) => push(map(unmap(val)), dif)

  // we define props on fn - must hide own props
  delete fn.length
  Object.defineProperties(fn, {
    valueOf: desc(get),
    toString: desc(get),
    [Symbol.toPrimitive]: desc(get),
    [symbol.observable]: desc(() => channel),
    [symbol.dispose]: desc(channel.close),
    [Symbol.asyncIterator]: desc(async function*() {
      let resolve = () => {}, buf = [], p,
      unsubscribe = fn(v => (
        buf.push(v),
        resolve(),
        p = new Promise(r => resolve = r)
      ))
      try {
        while (1) {
          while (buf.length) yield buf.shift()
          await p
        }
      } catch {
      } finally {
        unsubscribe()
      }
    })
  })

  if (arguments.length) {
    if (typeof source === 'function') {
      // v / observ
      if (observable(source)) {
        set = v => source(unmap(v))
        subscribe(null, null, source(v => push(map(v)), error))
      }
      // initializer
      else {
        set(source())
      }
    }
    // Observable (stateless)
    else if (source && source[symbol.observable]) {
      set = () => {}
      let unsubscribe = source[symbol.observable]().subscribe({
        next: v => push(map(v)),
        error
      })
      unsubscribe = unsubscribe.unsubscribe || unsubscribe
      subscribe(null, null, unsubscribe)
    }
    // async iterator (stateful, initial undefined)
    else if (source && (source.next || source[Symbol.asyncIterator])) {
      set = () => {}
      let stop
      ;(async () => {
        try {
          for await (let v of source) {
            if (stop) break
            push(map(v))
          }
        } catch(e) {
          error(e)
        }
      })()
      subscribe(null, null, () => stop = true)
    }
    // promise (stateful, initial undefined)
    else if (source && source.then) {
      set = p => (delete channel.current, p.then(v => push(map(v)), error))
      set(source)
    }
    else if (immutable(source)) {
      set(source)
    }
    // deps
    // NOTE: array/object may have symbol.observable, which redefines default deps behavior
    else {
      let vals = Array.isArray(source) ? [] : {}, keys = Object.keys(source), dchannel = c()

      // prevent recursion
      if (!depsCache.has(source)) depsCache.set(source, fn)

      // init observables
      keys.forEach(key => {
        // reserved fn props
        if (key in fn) {
          delete fn[key]
          Object.defineProperty(fn, key, {configurable: true, enumerable: true, writable: true})
        }
        let dep
        if (depsCache.has(source[key])) (dep = depsCache.get(source[key]))
        else if (!immutable(source[key])) (dep = v(source[key]))
        else if (depsCache.get(source)[key]) (dep = depsCache.get(source)[key])
        // redefine source property to observe it
        else {
          dep = v(() => vals[key] = source[key])
          let orig = Object.getOwnPropertyDescriptor(source, key)
          if (!orig || orig.configurable) Object.defineProperty(source, key, {
            configurable: true,
            enumerable: true,
            get: dep,
            set: orig && orig.set ? v => (orig.set.call(source, v), dep(orig.get())) : v => dep(v),
          })
        }
        fn[key] = dep
      })

      // we can handle only static deps
      if (!source[symbol.dispose]) source[symbol.dispose] = null
      // try { Object.seal(source) } catch {}

      const teardown = []
      for (const key in fn) {
        const dep = fn[key]
        teardown.push(dep(val => {
          vals[key] = val
          // avoid self-recursion
          if (fn !== dep) dchannel(vals, {[key]: val})
        }, error))
      }

      // any deps change triggers update
      dchannel((values, diff) => (push(map(values), diff)))

      // if initial value is derivable from initial deps - set it
      if (Object.keys(vals).length || !keys.length) dchannel(vals, vals)

      set = v => (Object.keys(v = unmap(v)).map(key => fn[key](v[key])))
      subscribe(null, null, () => {
        dchannel.close()
        teardown.map(teardown => teardown())
        teardown.length = 0
        for (let key in fn) if (!fn[key][symbol.observable]().observers.length) {
          depsCache.delete(fn[key])
          fn[key][symbol.dispose]()
        }
      })
    }
  }

  // cancel subscriptions, dispose
  subscribe(null, null, () => {
    // get = set = () => {throw Error('closed')}
    get = set = () => {}
    delete channel.current
  })

  // prevent any modifications
  Object.seal(fn)

  return fn
}


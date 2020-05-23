import { desc, observer, primitive, observable, symbol, slice } from './src/util.js'
import Channel from './src/channel.js'

const depsCache = new WeakMap

export default function v(source) {
  let fields = slice(arguments, 1)
  if (source && source.raw) return v(fields, fields => String.raw(source, ...fields))

  // current is mapped value (map can be heavy to call each get)
  let get = () => channel.current,
      set = (val, dif) => channel.push(map(unmap(val)), dif)

  const [map=v=>v, unmap=v=>v] = fields,
  channel = Channel(get, set),
  error = channel.error.bind(channel)

  // const fn = channel.fn.bind(channel)
  function fn () {
    if (channel.closed) return
    if (!arguments.length) return get()
    if (observer.apply(null, arguments)) {
      let unsubscribe = channel.subscribe(...arguments)
      // callback is registered as the last channel subscription, so send it immediately as value
      if ('current' in channel) channel.push.call(channel.observers.slice(-1), get(), get())
      return unsubscribe
    }
    return set.apply(null, arguments)
  }

  // we define props on fn - must hide own props
  delete fn.length
  Object.defineProperties(fn, {
    valueOf: desc(get),
    toString: desc(get),
    [Symbol.toPrimitive]: desc(get),
    [symbol.observable]: desc(() => channel),
    [symbol.dispose]: desc(channel.close.bind(channel)),
    [Symbol.asyncIterator]: desc(async function*() {
      let resolve = () => {}, buf = [], p,
      unsubscribe = fn(v => (buf.push(v), resolve(), p = new Promise(r => resolve = r)))
      try {
        while (1) {
          // while (buf.length) yield buf.shift()
          yield* buf.splice(0)
          await p
        }
      } catch {
      } finally {
        unsubscribe()
      }
    })
  })

  if (arguments.length) {
    if (primitive(source)) {
      set(source)
    }
    else if (typeof source === 'function') {
      // v / observ
      if (observable(source)) {
        set = v => source(unmap(v))
        channel.subscribe(null, null, source(v => channel.push(map(v)), error))
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
        next: v => channel.push(map(v)),
        error
      })
      unsubscribe = unsubscribe.unsubscribe || unsubscribe
      channel.subscribe(null, null, unsubscribe)
    }
    // async iterator (stateful, initial undefined)
    else if (source && (source.next || source[Symbol.asyncIterator])) {
      set = () => {}
      let stop
      ;(async () => {
        try {
          for await (source of source) {
            if (stop) break
            channel.push(map(source))
          }
        } catch(e) {
          error(e)
        }
      })()
      channel.subscribe(null, null, () => stop = true)
    }
    // promise (stateful, initial undefined)
    else if (source && source.then) {
      set = p => (delete channel.current, p.then(v => channel.push(map(v)), error))
      set(source)
    }
    // deps
    // NOTE: array/object may have symbol.observable, which redefines default deps behavior
    else {
      let vals = Array.isArray(source) ? [] : {}, keys = Object.keys(source), dchannel = new Channel()

      // prevent recursion
      if (!depsCache.has(source)) depsCache.set(source, fn)

      // init observables
      keys.forEach(key => {
        // reserved fn props - length, arguments etc.
        if (key in fn) (delete fn[key], Object.defineProperty(fn, key, {configurable: true, enumerable: true, writable: true}))
        let dep
        if (depsCache.has(source[key])) (dep = depsCache.get(source[key]))
        else if (observable(source[key])) (dep = v(source[key]))
        // reuse existing prop observable
        else if (depsCache.get(source)[key]) (dep = depsCache.get(source)[key])
        // redefine source property to observe it
        else {
          dep = v(() => vals[key] = source[key])
          dep(v => vals[key] = source[key] = v)
          // props observing logic is moved to `a`
        }
        fn[key] = dep
      })

      // we can handle only static deps
      if (!source[symbol.dispose]) source[symbol.dispose] = null
      try { Object.seal(source) } catch {}

      const teardown = []
      for (const key in fn) {
        const dep = fn[key]
        teardown.push(dep(val => {
          vals[key] = val
          // avoid self-recursion
          if (fn !== dep) dchannel.push(vals, {[key]: val})
        }, error))
      }

      // any deps change triggers update
      dchannel.subscribe((values, diff) => channel.push(map(values), diff))

      // if initial value is derivable from initial deps - set it
      if (Object.keys(vals).length || !keys.length) dchannel.push(vals, vals)

      set = v => (Object.keys(v = unmap(v)).map(key => fn[key](v[key])))
      channel.subscribe(null, null, () => {
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
  channel.subscribe(null, null, () => {
    // get = set = () => {throw Error('closed')}
    get = set = () => {}
    delete channel.current
  })

  // prevent further modifications
  Object.seal(fn)

  return fn
}


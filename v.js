import _observable from 'symbol-observable'
import c, { observer } from './channel.js'

const depsCache = new WeakMap

export default function v(source, map=v=>v, unmap=v=>v) {
  const channel = c(), { subscribe, observers, push } = channel

  const fn = (...args) => {
    if (!args.length) return get()
    if (observer(...args)) {
      let unsubscribe = subscribe(...args)
      // callback is registered as the last channel subscription, so send it immediately as value
      if ('current' in fn) push(get(), observers.slice(-1))
      return unsubscribe
    }
    return set(...args)
  }
  // we define props on fn - must hide own props
  Object.defineProperties(fn, {
    length: {value: null, writable: true, enumerable: false},
    name: {value: null, writable: true, enumerable: false},
  })
  const value = fn
  // const value = new Proxy(fn, {
  //   get(fn, prop) {
  //     if (channel.canceled) return
  //     if (prop !== 'length' && prop in fn) return fn[prop]
  //     if (source) return source[prop]
  //   },
  //   has(fn, prop) {
  //     if (channel.canceled) return
  //     return prop in fn || (source && prop in source)
  //   },
  //   set(fn, prop, v) {
  //     if (channel.canceled) return true
  //     else source[prop] = v
  //     // need reinit
  //     return true
  //   },
  //   deleteProperty(fn, prop) {
  //     delete source[prop]
  //     // need reinit
  //     return true
  //   }
  // })

  // current is mapped value (map can be heavy to call each get)
  let get = () => fn.current
  let set = v => push(fn.current = map(unmap(v)))

  fn.valueOf = fn.toString = fn[Symbol.toPrimitive] = get
  fn[_observable] = () => channel
  fn.cancel = channel.cancel

  if (arguments.length) {
    // v / observ
    if (typeof source === 'function') {
      // NOTE: we can't simply check args.length, because v(fn)(fx) is valid case for observable input
      if (observable(source)) {
        set = v => source(unmap(v))
        subscribe(null, null, source(v => push(fn.current = map(v))))
      }
      else {
        set(source())
      }
    }
    // Observable (stateless)
    else if (source && source[_observable]) {
      set = () => {}
      let unsubscribe = source[_observable]().subscribe({next: v => push(fn.current = map(v))})
      unsubscribe = unsubscribe.unsubscribe || unsubscribe
      subscribe(null, null, unsubscribe)
    }
    // group
    // NOTE: array/object may have _observable, which redefines default deps behavior
    else if (Array.isArray(source) || object(source)) {
      let vals = fn.current = new source.constructor
      let deps = []
      deps.channel = c()
      value[Symbol.iterator] = deps[Symbol.iterator].bind(deps)
      if (!depsCache.has(source)) depsCache.set(fn.source = source, value)
      for (let name in source) {
        const dep = source[name], depv = depsCache.has(dep) ? depsCache.get(dep) : v(dep)
        // console.log(dep, depsCache.has(dep), depv)
        depv(v => {
          vals[name] = v
          // avoid self-recursion here
          if (value !== depv) deps.channel(vals)
        })
        deps.push(value[name] = depv)
      }
      deps.channel(v => push(fn.current = map(v)))
      if (Object.keys(vals).length || !Object.keys(source).length) deps.channel(vals)
      set = v => deps.channel.push(unmap(v))
      subscribe(null, null, () => {
        deps.map(depv => depv.cancel())
        deps.channel.cancel()
      })
    }
    // input
    else if (input(source)) {
      const el = source

      const iget = el.type === 'checkbox' ? () => el.checked : () => el.value

      const iset = {
        text: value => el.value = (value == null ? '' : value),
        checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
        'select-one': value => {
          [...el.options].map(el => el.removeAttribute('selected'))
          el.value = value
          if (el.selectedOptions[0]) el.selectedOptions[0].setAttribute('selected', '')
        }
      }[el.type]

      set = v => (iset(unmap(v)), push(fn.current = iget()))
      const update = e => set(iget())

      // normalize initial value
      update()

      el.addEventListener('change', update)
      el.addEventListener('input', update)
      subscribe(null, null, () => {
        // set = () => {}
        el.removeEventListener('change', update)
        el.removeEventListener('input', update)
      })
    }
    // async iterator (stateful, initial undefined)
    else if (source && (source.next || source[Symbol.asyncIterator])) {
      set = () => {}
      let stop
      ;(async () => {
        for await (let v of source) {
          if (stop) break
          push(fn.current = map(v))
        }
      })()
      subscribe(null, null, () => stop = true)
    }
    // promise (stateful, initial undefined)
    else if (source && source.then) {
      set = p => (delete fn.current, p.then(v => push(fn.current = map(v))))
      set(source)
    }
    // ironjs
    else if (source && source.mutation && '_state' in source) {
      const Reactor = source.constructor
      const reaction = new Reactor(() => set(source.state))
      set(source.state)
    }
    // plain value
    else {
      set(source)
    }
  }

  // cancel subscriptions, dispose
  subscribe(null, null, () => {
    // get = set = () => {throw Error('closed')}
    get = set = () => {}
    depsCache.delete(fn.source)
    delete fn.current
  })

  return value
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (!arg) return false
  return !!(
    arg[_observable]
    || (typeof arg === 'function' && arg.set)
    || arg[Symbol.asyncIterator]
    || arg.next
    || arg.then
    || arg && arg.mutation && '_state' in arg
  )
}

export function object (value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}

export function input (arg) {
  return arg && (arg.tagName === 'INPUT' || arg.tagName === 'SELECT')
}

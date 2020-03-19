import _observable from 'symbol-observable'
import c, { observer } from './channel.js'

const _current = Symbol.for('@spect.current')

export default function v(init, map=v=>v, unmap=v=>v) {
  const channel = c(), { subscribe, observers, push } = channel

  const value = (...args) => {
    if (!args.length) return get()
    if (observer(...args)) {
      let unsubscribe = subscribe(...args)
      // callback is registered as the last channel subscription, so send it immediately as value
      if (_current in value) push(get(), observers.slice(-1))
      return unsubscribe
    }
    return set(...args)
  }

  // current is mapped value (map can be heavy to call each get)
  const get = () => value[_current]
  let set = () => {}

  // observ
  if (typeof init === 'function') {
    set = v => init(unmap(v))
    subscribe(null, null, init(v => push(value[_current] = map(v))))
  }
  // Observable (stateless)
  else if (init && init[_observable]) {
    let unsubscribe = init[_observable]().subscribe({next: v => push(value[_current] = map(v))})
    unsubscribe = unsubscribe.unsubscribe || unsubscribe
    subscribe(null, null, unsubscribe)
  }
  // group
  // NOTE: array/object may have _observable, which redefines default deps behavior
  else if (Array.isArray(init) || object(init)) {
    let vals = value[_current] = new init.constructor
    const depsChannel = c(), deps = []
    for (let name in init) {
      let dep = init[name], depv = v(dep)
      depv(v => (vals[name] = v, depsChannel(vals)))
      deps.push(value[name] = depv)
    }
    value[Symbol.iterator] = deps[Symbol.iterator].bind(deps)
    depsChannel(v => push(value[_current] = map(v)))
    if (Object.keys(vals).length || !Object.keys(init).length) depsChannel(vals)
    set = v => push(value[_current] = map(unmap(v)))
    subscribe(null, null, () => (deps.map(depv => depv.cancel()), depsChannel.cancel()))
  }
  // input
  else if (init && (init.tagName === 'INPUT' || init.tagName === 'SELECT')) {
    const el = init

    const iget = el.type === 'checkbox' ? () => el.checked : () => el.value

    const iset = {
      text: value => el.value = (value == null ? '' : value),
      checkbox: value => (el.checked = value, el.value = (value ? 'on' : ''), value ? el.setAttribute('checked', '') : el.removeAttribute('checked')),
      'select-one': value => ([...el.options].map(el => el.removeAttribute('selected')), el.value = value, el.selectedOptions[0].setAttribute('selected', ''))
    }[el.type]

    set = v => (iset(unmap(v)), push(value[_current] = iget()))
    const update = e => set(iget())

    // normalize initial value
    update()

    el.addEventListener('change', update)
    el.addEventListener('input', update)
    subscribe(null, null, () => {
      set = () => {}
      el.removeEventListener('change', update)
      el.removeEventListener('input', update)
    })
  }
  // async iterator (stateful, initial undefined)
  else if (init && (init.next || init[Symbol.asyncIterator])) {
    let stop
    ;(async () => {
      for await (let v of init) {
        if (stop) break
        push(value[_current] = map(v))
      }
    })()
    subscribe(null, null, () => stop = true)
  }
  // promise (stateful, initial undefined)
  else if (init && init.then) {
    set = p => (delete value[_current], p.then(v => push(value[_current] = map(v))))
    set(init)
  }
  // plain value
  else {
    set = v => push(value[_current] = map(unmap(v)))
    if (arguments.length) set(init)
  }

  value.valueOf = value.toString = value[Symbol.toPrimitive] = get
  value[_observable] = () => channel
  value.cancel = channel.cancel

  // cancel subscriptions, dispose
  subscribe(null, null, () => {
    delete value.current
  })

  return value
}

export function primitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

export function observable(arg) {
  if (!arg) return false
  return !!(typeof arg === 'function' || arg[_observable] || arg[Symbol.asyncIterator] || arg.next || arg.then)
}

export function object (value) {
	if (Object.prototype.toString.call(value) !== '[object Object]') return false;
	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
}

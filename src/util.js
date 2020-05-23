const Symbol = globalThis.Symbol

export const symbol = {
  dispose: Symbol ? (Symbol.dispose || (Symbol.dispose = Symbol('dispose'))) : '@@dispose',
  observable: Symbol ? (Symbol.observable || (Symbol.observable = Symbol('observable'))) : '@@observable'
}

// we can't handle observable subscription here - it deals with node[_ref], which is not this function concern
export const attr = (el, k, v) => {
  // if (arguments.length < 3) return (value = el.getAttribute(name)) === '' ? true : value

  if (!el.setAttribute) return

  if (v === false || v == null) el.removeAttribute(k)
  else if (v === true) el.setAttribute(k, '')
  else if (primitive(v)) el.setAttribute(k, v)
  // class=[a, b, ...c]
  else if (k === 'class' && Array.isArray(v)) el.setAttribute(k, v.filter(Boolean).join(' '))
  // onclick={} - skip
  else if (typeof v === 'function') {}
  // style={}
  else if (k === 'style' && v.constructor === Object)
    el.setAttribute(k,(k=v,v=Object.values(v),Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')))
}


export const observer = (next, error, complete) => (next && next.call) || (error && error.call) || (complete && complete.call) || (next && observer(next.next, next.error, next.complete))

export const desc = value => Object.assign({configurable: false, enumerable: false}, value === undefined ? {writable: true} : {value})

export const list = arg => Array.isArray(arg) || (!primitive(arg) && !arg.nodeType && arg[Symbol.iterator])

export const esc = n => n.replace(/"|'|\\/g, '')

// join an array with a function
export const join = (arr, fn) => {
  let str = '', i = 0
  for (; i < arr.length - 1; i++) str += arr[i] + fn(i)
  return str += arr[i]
}

// not so generic, but performant
export const primitive = (val) =>
  !val ||
  typeof val === 'string' ||
  typeof val === 'boolean' ||
  typeof val === 'number' ||
  (typeof val === 'object' ? (val instanceof RegExp || val instanceof Date) :
  typeof val !== 'function')

export const observable = (arg) =>
  arg && !!(
    arg[symbol.observable]
    || (typeof arg === 'function' && arg.set)
    || arg[Symbol.asyncIterator]
    || arg.next
    || arg.then
    // || arg.mutation && arg._state != null
  )

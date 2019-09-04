import equal from 'fast-deep-equal'
import delegated from 'delegate-it'
import { parse as parseStack } from 'stacktrace-parser'
import tuple from 'immutable-tuple'
import htm from 'htm'
import scopeCss from 'scope-css'
import insertCss from 'insert-styles'
import pget from 'dlv'
import pset from 'dset'
import kebab from 'kebab-case'
import isObject from 'is-plain-obj'
import {
  patch,
  elementOpen,
  elementClose,
  text,
  attributes,
  symbols,
  applyProp,
  applyAttr,
  elementVoid,
  currentPointer,
  skipNode
} from 'incremental-dom'
import onload from 'fast-on-load'

attributes.class = applyAttr
attributes.is = (...args) => (applyAttr(...args), applyProp(...args))
attributes[symbols.default] = applyProp

let html = htm.bind(h)


// used to turn stacktrace-based effects, opposed to fxCount
const isStacktraceAvailable = !!(new Error).stack
const isCustomElementsAvailable = typeof customElements !== 'undefined'

const $cache = new WeakMap,
  setCache = new WeakMap,
  qCache = new WeakMap,
  pCache = new WeakMap,
  aspectsCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  observables = new WeakMap,
  stateCache = new WeakMap,
  attrObserverCache = new WeakMap,
  cssClassCache = new WeakMap


let fxCount, // used as order-based effect key
  fxId, // used as precompiled effect key
  currentElement,
  currentAspect

const SPECT_CLASS = '👁'

function updateObservers(el, effect, path) {
  let key = tuple(el, effect, path)
  let observers = observables.get(key)
  if (!observers) return
  for (let [el, fn] of observers) {
    spect(el).queue(fn)
  }
}

function callAspect (el, fn) {
  let prevAspect = currentAspect,
    prevElement = currentElement

  fxCount = 0
  currentElement = el
  currentAspect = fn

  let result = fn.call(el, spect(el))
  currentAspect = prevAspect
  currentElement = prevElement
  return result
}


export default function spect(...args) {
  return new $(...args)
}


// Why Array
// - Promise: args don't match
// + Array: redundant array methods, but looks good in debugger; also internal set can be Weak
// - WeakSet: we have to be able to iterate over items
// - HTMLCollection: no way to add real elements, collection can only be polyfilled
// - Set: add, remove, has, clear + iterator, but looks bad in debugger
// Caching is disabled since we may need assign props
class $ extends Array {
  constructor(arg, ...args) {
    super()

    // $`...tpl`
    if (arg && arg.raw) {
      return spect(unwrapElement(spect(document.createDocumentFragment()).html(arg, ...args)))
    }

    // $('.selector')
    // FIXME live collection would require whether re-querying each fx call
    // or selector observer - probably too expensive
    if (typeof arg === 'string') {
      arg = arg.trim()

      // hyperscript: $(tagName, props, ...children?)
      if ((args.length && args[0] == null) || isObject(args[0])) return h(arg, ...args)

      // create html: $('<></> html content')
      if (/</.test(arg)) {
        let statics = [arg]
        statics.raw = [arg]
        let result = (spect(document.createDocumentFragment())).html(statics, ...args)
        return spect(unwrapElement(result[0].childNodes))
      }

      // selector
      let within = args[0] ? unwrapElement(args[0]) : document

      arg = within.querySelector(arg)

      if (!arg) return this
    }

    // FIXME: should cache have invalidation?
    if (arg instanceof $) return arg
    if ($cache.has(arg)) return $cache.get(arg)

    // wrapped snapshots
    let uarg = unwrapElement(arg)
    if ($cache.has(uarg)) return $cache.get(uarg)

    // set of elements per collection
    setCache.set(this, new WeakSet)

    // planned effects
    qCache.set(this, new Set)

    // promise per collection (microtask)
    pCache.set(this, Promise.resolve())

    // $(el|frag|text|node)
    if (uarg instanceof Node) {
      $cache.set(uarg, this)
      this.add(uarg)
      return this
    }

    if (!(arg instanceof Node) && isIterable(arg)) {
      this.add(...arg)
    }
    else if (arg) {
      this.add(arg)
    }

    if (this.length === 1) {
      $cache.set(this[0], this)
    }

    return this
  }

  add(...args) {
    let set = setCache.get(this)
    for (let item of args) {
      if (set.has(item)) continue
      set.add(item)
      super.push(item)
    }
  }

  remove(...args) {
    let set = setCache.get(this)
    for (let item of args) {
      if (!set.has(item)) continue
      set.remove(item)
    }
    this.length = 0
    this.push(...set)
  }

  // default map calls Array(n)
  map(fn) {
    // FIXME: may lose props, not sure that's good
    return spect([...this].map(fn))
  }

  then(fn) {
    return pCache.get(this).then(fn)
  }

  // plan aspect to run
  queue(fn) {
    let q = qCache.get(this), p = pCache.get(this)
    if (!q.size) p.then(() => {
      for (let fn of q) this.forEach(el => callAspect(el, fn))
      q.clear()
    })
    q.add(fn)
    return this
  }
}


// effects are exposed on collections, read-only
const effects = {
  use: function (...fns) {
    this.forEach(el => {
      let aspects = aspectsCache.get(el)
      if (!aspects) aspectsCache.set(el, aspects = [])

      fns.forEach(fn => {
        if (aspects.indexOf(fn) < 0) {
          aspects.push(fn)
          callAspect(el, fn)
        }
      })
    })

    return this
  },

  update: function () {
    this.forEach(el => {
      let aspects = aspectsCache.get(el)
      if (!aspects) return

      aspects.forEach(fn => callAspect(el, fn))
    })

    return this
  },

  fx: function (fn, deps) {
    if (!commit(fxKey('fx'), deps, () => {
      destroy.forEach(fn => fn && fn())
    })) {
      return this
    }

    let destroy = []

    this.queue(() => {
      this.forEach(el => {
        let destructor = fn.call(el)
        destroy.push(typeof destructor === 'function' ? destructor : noop)
      })
    })

    return this
  },

  on: function (evts, delegate, fn, deps) {
    if (typeof delegate === 'function') {
      deps = fn
      fn = delegate
      delegate = null
    }

    if (!commit(fxKey('on'), deps, () => destroy.forEach(fn => fn && fn()))) return this

    let destroy = []

    evts = evts.split(/\s+/)

    if (delegate) {
      evts.forEach(evt => this.forEach(el => {
        const delegation = delegated(el, delegate, evt, fn)
        destroy.push(() => delegation.destroy())
      }))
    }
    else {
      evts.forEach(evt => this.forEach(el => {
        el.addEventListener(evt, fn)
        destroy.push(() => el.removeEventListener(evt, fn))
      }))
    }

    return this
  },

  emit: function (evt, o, deps) {
    if (!commit(fxKey('emit'), deps)) return this

    if (evt instanceof Event) {
      this.forEach(el => el.dispatchEvent(evt))
    }
    else if (typeof evt === 'string') {
      evt = evt.split(/\s+/)
      evt.forEach(evt => this.forEach(el => el.dispatchEvent(new CustomEvent(evt))))
    }
    else if (typeof evt === 'object') {
      this.forEach(el => el.dispatchEvent(new CustomEvent(evt.name, e)))
    }

    return this
  },

  mount: function (fn, deps = true) {
    if (!commit(fxKey('mount'), deps, () => destroy.forEach(fn => fn && fn()))) return

    let destroy = []

    this.forEach(el => {
      let unload, connected = false
      let handle = [() => (unload = fn(), connected = true), () => unload && unload()]

      onload(el, ...handle)

      // FIXME: workaround https://github.com/hyperdivision/fast-on-load/issues/3
      if (!connected && isConnected(el)) {
        handle[0]()
      }

      destroy.push(() => onload.delete(el, ...handle))
    })

    return this
  },

  state: createEffect('state', ...(() => {
    function getState(el) {
      let state = stateCache.get(el)
      if (!state) stateCache.set(el, state = {})
      return state
    }
    return [
      function (...args) { return pget(getState(this[0]), String.raw(...args)) },
      getState,
      (el, name) => pget(getState(el), name),
      (el, name, value) => pset(getState(el), name, value)
    ]
  })()),

  prop: createEffect('prop',
    function (...args) { return this[0][String.raw(...args)] },
    (el) => el,
    (el, name) => el[name],
    (el, name, value) => el[name] = value
  ),

  attr: createEffect('attr',
    function (...args) {
      return this[0].getAttribute(String.raw(...args))
    },
    el => {
      let obj = {}
      for (let attr of el.attributes) obj[attr.name] = attr.value
      return obj
    },
    (el, name) => {
      if (!attrObserverCache.has(el)) {
        let observer = new MutationObserver(records => {
          for (let i = 0, length = records.length; i < length; i++) {
            let { target, oldValue, attributeName } = records[i];
            updateObservers(target, 'attr', attributeName)
          }
        })
        observer.observe(el, { attributes: true })
        attrObserverCache.set(el, observer)
      }
      if (!el.hasAttribute(name)) return false
      if (el.getAttribute(name) === '') return true
      return el.getAttribute(name)
    },
    (el, name, value) => {
      if (value === true && !el.hasAttribute(name)) el.toggleAttribute(name)
      else if ((value === false || value == null) && el.hasAttribute(name)) el.removeAttribute(name)
      else el.setAttribute(name, value)
    },
    (a, b) => b + '' === a + ''
  ),

  html: function (...args) {
    // tpl string: html`<a foo=${bar}/>`
    let vdom
    if (args[0].raw) vdom = html(...args)

    // html('<a foo/>')
    // else if (typeof args[0] === 'string') vdom = html(args)

    else {
      // fn: html(children => [...children])
      if (typeof args[0] === 'function') {
        this.forEach(el => {
          let input = [...el.childNodes]
          let output = args[0](input)
          spect(el).html(output)
        })
        return this
      }

      // direct JSX: html(<a foo={bar}/>)
      else vdom = args[0]
    }

    if (!vdom) {
      this.forEach(el => {
        while (el.firstChild) el.removeChild(el.firstChild)
      })
      return this
    }

    if (!Array.isArray(vdom)) vdom = [vdom]

    // stub native nodes
    let count = 0, refs = {}
    vdom = vdom.map(function map(arg) {
      if (arg == null) return

      if (Array.isArray(arg)) {
        if (!arg.length) return
        return arg.map(map)
      }

      if (arg instanceof NodeList || arg instanceof HTMLCollection) {
        let frag = document.createDocumentFragment()
        while (arg.length) frag.appendChild(arg[0])
        refs[++count] = frag
        return { ref: count }
      }
      if (arg instanceof DocumentFragment || typeof arg === 'function') {
        refs[++count] = arg
        return { ref: count }
      }
      if (arg instanceof Node) {
        arg.remove()
        refs[++count] = arg
        return { ref: count }
      }

      if (arg.children) arg.children = map(arg.children)

      return arg
    })

    this.forEach(el => {
      patch(el, render, vdom)

      // reinsert refs
      for (let id in refs) {
        let refNode = el.querySelector('#' + SPECT_CLASS + '-ref-' + id)
        let parent = refNode.parentNode
        let next = refNode.nextSibling
        if (typeof refs[id] === 'function') {
          parent.removeChild(refNode)
          let result = refs[id](parent)
          if (result != null) {
            let newNode = result instanceof Node ? result : document.createTextNode(result)
            next ? parent.insertBefore(newNode, next) : parent.appendChild(newNode)
          }
        }
        else {
          parent.replaceChild(refs[id], refNode)
        }
      }
    })

    function render(arg) {
      if (arg == null) return

      // numbers/strings serialized as text
      if (typeof arg === 'number') return text(arg)
      if (typeof arg === 'string') return text(arg)

      // FIXME: .length can be wrong check
      if (arg.length) return [...arg].forEach(arg => render(arg))

      // stub refs to native els
      if (arg.ref) return elementVoid('span', null, ['id', SPECT_CLASS + '-ref-' + arg.ref])

      // objects create elements
      let { tag, key, props, staticProps, children, use, create, fx, fn } = arg

      // fragment (direct vdom)
      if (!tag) return children && children.forEach(render)

      let el
      if (!children || !children.length) {
        el = elementVoid(create, key, staticProps, ...props)
      }
      else {
        el = elementOpen(create, key, staticProps, ...props)
        children.forEach(render)
        elementClose(create)
      }

      const $el = (fn || use || fx.length) ? spect(el) : null

      // pass props down to aspects/init
      if ($el) {
        for (let i = 0; i < props.length; i+= 2) {
          let name = props[i]
          if ($.prototype.hasOwnProperty(name)) continue
          $el[name] = props[i+1]
        }
      }

      // init component
      if (fn) $el.queue(fn)

      // run aspects
      if (use) use.forEach(fn => $el.queue(fn))

      // run inline effects
      for (let i = 0; i < fx.length; i += 2) {
        let effect = fx[i], val = fx[i + 1]
        let arg = [val]
        arg.raw = arg
        $el[effect](arg)
      }
    }

    return this
  },

  text: createEffect('text', function (...args) {
    let str = String.raw(...args)
    this.forEach(el => el.textContent = str)
  }, el => el.textContent, (el, value) => el.textContent = value),

  class: createEffect('class',
    function (...args) {
      let str = String.raw(...args)
      this.forEach(el => el.className = str)
      return this
    },
    el => {
      let obj = {}
      for (let cl of el.classList) obj[cl.name] = cl.value
      return obj
    },
    (el, name) => el.classList.contains(name),
    (el, name, value) => {
      if (!value) el.classList.remove(name)
      else el.classList.add(name)
      return this
    }),

  css: createEffect('css', function (statics, ...parts) {
    let str = String.raw(statics, ...parts)

    let className = cssClassCache.get(this)

    if (!className) {
      className = `${SPECT_CLASS}-${uid()}`
      cssClassCache.set(this, className)
      this.forEach(el => el.classList.add(className))
    }

    str = scopeCss(str, '.' + className)
    insertCss(str, { id: className })

    return this
  }, (el) => {

  }, (el, name) => {

  }, (el, name, value) => {

  })
}

for (let name in effects) {
  let fn = effects[name]
  registerEffect(name, fn)
}
export function registerEffect(name, fn) {
  Object.defineProperty($.prototype, name, {
    get() {
      return fn.bind(this)
    },
    set() {
      throw Error('Effect `' + name + '` cannot be redefined.')
    }
  })
}


// register effect call, check deps, if changed - call destroy
function commit(key, deps, destroy) {
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
function fxKey (fxName) {
  let key

  // precompiled bundle inserts unique fxid before effect calls
  if (fxId) {
    key = tuple(currentElement, currentAspect, fxName, fxId)
    fxId = null
  }
  else {
    // stacktrace key is precise for
    if (isStacktraceAvailable) {
      // FIXME: exact stack is susceptible to babel-ish transforms
      let [fxKeysite, fxsite, callsite, ...trace] = parseStack((new Error).stack)
      let callsiteurl = callsite.file + ':' + callsite.lineNumber + ':' + callsite.column
      key = tuple(currentElement, currentAspect, fxName, callsiteurl)
    }
    // fallback to react order-based key
    else {
      key = tuple(currentElement, currentAspect, fxName, fxCount++)
    }
  }

  return key
}

function createEffect (effectName, tpl, get0, get, set, is = Object.is) {
  return function effect (...args) {
    // get()
    if (!args.length) {
      return get0(this[0])
    }

    // effect`...`
    if (args[0].raw) {
      return tpl.call(this, ...args)
    }

    // effect(s => {...}, deps)
    if (typeof args[0] === 'function') {
      let fn = args.shift()
      let deps = args.shift()

      if (!commit(fxKey(effectName), deps)) return false

      this.forEach(el => {
        let draft
        let state = get0(el)
        try {
          // Object.create is faster than assign
          draft = Object.create(state)
          let result = fn(draft)
          if (typeof result === 'object') draft = result
        } catch (e) { }

        Object.getOwnPropertyNames(draft).forEach(prop => {
          if (draft[prop] !== state[prop]) setNameValue(el, prop, draft[prop])
        })
      })

      return this
    }

    // set(obj, deps)
    if (typeof args[0] === 'object') {
      let props = args.shift()
      let deps = args.shift()

      if (!commit(fxKey(effectName), deps)) return

      for (let name in props) {
        this[effectName](name, props[name], ...args)
      }
      return this
    }

    // get(name)
    if (args.length == 1) {
      let [name] = args
      let [el] = this

      let key = tuple(el, effectName, name)
      if (!observables.has(key)) observables.set(key, new Set)
      if (currentElement) {
        observables.get(key).add(tuple(currentElement, currentAspect))
      }

      return get(el, name)
    }

    // set(name, value)
    let [name, value, deps] = args
    if (!commit(fxKey(effectName), deps)) return
    this.forEach(el => setNameValue(el, name, value))

    return this
  }

  function setNameValue(el, name, value) {
    let prev = get(el, name)

    if (is(prev, value)) return

    set(el, name, value)
    updateObservers(el, effectName, name)
  }
}

const customElementsCache = {}
function h(target, props = {}, ...children) {
  let use = [], propsList = []
  let staticProps = []
  let tag, classes = [], id, create, is, fn, fx = []

  if (typeof target === 'function') {
    fn = target
    tag = getTagName(fn)

    if (isCustomElementsAvailable) {
      if (!customElements.get(tag)) customElements.define(tag, createClass(fn, HTMLElement))
    }
  }
  else if (typeof target === 'string') {
    let parts = parseTagComponents(target)
    tag = parts[0]
    id = parts[1]
    classes = parts[2]
  }

  for (let prop in props) {
    let val = props[prop]
    // <div use=${use}>
    if (prop === 'use') Array.isArray(val) ? use.push(...val) : use.push(val)

    // <div is=${fn}>
    else if (prop === 'is') {
      if (typeof val === 'function') {
        fn = val
        is = getTagName(fn)
        staticProps.push('is', is)

        if (isCustomElementsAvailable) {
          if (!customElements.get(is)) {
            let Component = createClass(fn, Object.getPrototypeOf(document.createElement(tag)).constructor)
            customElements.define(is, Component, { extends: tag })
            create = customElementsCache[is] = function () { return document.createElement(tag, { is }) }
          }
          else {
            create = customElementsCache[is]
          }
        }
      }
      // <div is=name>
      // we don't touch that, user knows what he's doing
    }

    // <${Component}#x.y.z/> htm props hack
    else if (val === true && prop[0] === '#' || prop[0] === '.') {
      let parts = parseTagComponents(prop)
      if (!id && parts[1]) id = parts[1]
      classes.push(...parts[2])
    }

    // <div effect=${value}/>
    else if (effects[prop]) {
      fx.push(prop, val)
    }

    else {
      propsList.push(prop, val)
    }
  }

  if (id) staticProps.push('id', id)
  if (classes.length) propsList.push('class', classes.join(' '))

  if (!create) create = tag

  let key = id || (props && (props.key || props.id))

  // FIXME: use more static props, like `type`
  return {
    tag,
    key,
    use,
    create,
    props: propsList,
    staticProps,
    children,
    is,
    fn,
    fx
  }
}

// a#b.c.d => ['a', 'b', ['c', 'd']]
function parseTagComponents (str) {
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}

let nameCache = new WeakMap
const counters = {}
function getTagName(fn) {
  if (nameCache.has(fn)) return nameCache.get(fn)

  // do not allow anonymous functions in aspects
  if (!fn.name && currentElement) throw Error('Component function should have a name')
  let name = fn.name ? paramCase(fn.name) : 'spect'

  // add num suffix to single-word names
  let parts = name.split('-')
  if (parts.length < 2) {
    if (!counters[name]) counters[name] = 0
    name += '-' + (counters[name]++)
  }

  nameCache.set(fn, name)

  return name
}

// TODO: make use of connected/disconnected callbacks
function createClass(fn, HTMLElement) {
  return class HTMLSpectComponent extends HTMLElement {
    constructor() {
      super()
    }

    connectedCallback() {
    }

    disconnectedCallback() {
    }
  }
}



export function isIterable(val) {
  return (val != null && typeof val[Symbol.iterator] === 'function');
}

export const raf = window.requestAnimationFrame

export function paramCase(str) {
  str = kebab(str)

  if (str[0] === '-') return str.slice(1)
  return str
}

export function noop() { }

export function uid() { return Math.random().toString(36).slice(2, 8) }

export const isConnected = 'isConnected' in window.Node.prototype
  ? node => node.isConnected
  : node => document.documentElement.contains(node)

// turn any element collection-like with single node into direct element
function unwrapElement(el) {
  if (!el) return el
  if (el instanceof Element) return el
  if (el.childNodes) return unwrapElement(el.childNodes)

  // nodelist, htmlcollection, array etc.
  if (el.length === 1) {
    return unwrapElement(el[0])
  }
  return el
}

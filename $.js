import equal from 'fast-deep-equal'
import delegated from 'delegate-it'
import { parse as parseStack } from 'stacktrace-parser'
import tuple from 'immutable-tuple'
import htm from 'htm'
import kebab from 'kebab-case'
import {
  patch,
  elementOpen,
  elementClose,
  text,
  attributes,
  symbols,
  applyProp,
  applyAttr
} from 'incremental-dom'
import onload from 'fast-on-load'

attributes.class = applyAttr
attributes.is = (...args) => (applyAttr(...args), applyProp(...args))
attributes[symbols.default] = applyProp

let html = htm.bind(h)

// used to turn stacktrace-based effects, opposed to fxCount
const isStacktraceAvailable = true


const elCache = new WeakMap,
  aspectsCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  observables = new WeakMap,
  stateCache = new WeakMap,
  attrCache = new WeakMap

let fxCount, // used as order-based effect key
  fxId, // used as precompiled effect key
  currentElement,
  currentAspect


export default function create(...args) {
  let doc = this && this.createElement ? this : document
  return new $(doc, ...args)
}

class $ extends Array {
  constructor (document, arg, ...args) {
    super()

    if (elCache.has(arg)) return elCache.get(arg)

    // $(el|frag|text|node)
    if (arg instanceof Node) {
      this.push(arg)
      elCache.set(arg, this)
      return this
    }

    // $($)
    if (arg instanceof $) return arg

    // $`...tpl`
    if (arg && arg.raw) {
      return create((create(document.createDocumentFragment())).html(arg, ...args)[0].childNodes)
    }

    if (typeof arg === 'string') {
      arg = arg.trim()

      // html case $`<></> html content`
      if (/</.test(arg)) {
        let statics = [arg]
        statics.raw = [arg]
        let result = (create(document.createDocumentFragment())).html(statics, ...args)
        return create(result[0].childNodes)
      }

      arg = document.querySelector(arg)
    }

    // selector can query new els set, so we update the list
    if (typeof arg === 'string') {
      arg = document.querySelectorAll(arg)
    }

    if (isIterable(arg)) {
      let set = new Set()

      for (let i = 0; i < arg.length; i++) {
        let el = arg[i]
        if (!set.has(el)) {
          set.add(el)
          this.push(el)
        }
      }
      if (this.length === 1) elCache.set(this[0], this)
    }
    else {
      this[0] = arg
      elCache.set(this[0], this)
    }

  }
}


function callAspect(el, fn) {
  let prevAspect = currentAspect,
    prevElement = currentElement
  fxCount = 0
  currentElement = el
  currentAspect = fn
  let result = fn.call(el, el)
  currentAspect = prevAspect
  currentElement = prevElement
  return result
}


let q = new Set, planned = null
function updateObservers(el, effect, path) {
  let key = tuple(el, effect, path)
  let observers = observables.get(key)
  if (!observers) return
  for (let observer of observers) {
    q.add(observer)
  }
  if (!planned) planned = Promise.resolve().then(() => {
    planned = null
    for (let [el, fn] of q) callAspect(el, fn)
  })
}


Object.assign($.prototype, {
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

  _update: function () {
    this.forEach(el => {
      let aspects = aspectsCache.get(el)
      if (!aspects) return

      aspects.forEach(fn => callAspect(el, fn))
    })

    return this
  },

  fx: function (fn, deps) {
    if (!commit(fxKey(), deps, () => destroy.forEach(fn => fn && fn()))) return

    let destroy = []

    Promise.resolve().then(() => {
      this.forEach(el => {
        let destructor = fn.call(el, el)
        destroy.push(typeof destructor === 'function' ? destructor : noop)
      })
    })
  },

  on: function (evts, delegate, fn, deps) {
    if (typeof delegate === 'function') {
      deps = fn
      fn = delegate
      delegate = null
    }

    if (!commit(fxKey(), deps, () => destroy.forEach(fn => fn && fn()))) return

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
  },

  mount: function (handle, deps) {
    if (!commit(fxKey(), deps, () => destroy.forEach(fn => fn && fn()))) return

    let destroy = []

    this.forEach(el => {
      let unload
      let handle = [() => unload = fn(), () => unload && unload()]

      onload(el, ...handle)

      destroy.push(() => onload.destroy(el, ...handle))
    })
  },

  state: createEffect('state', ...(() => {
    function getState(el) {
      let state = stateCache.get(el)
      if (!state) stateCache.set(el, state = {})
      return state
    }
    return [getState, (el, name) => getState(el)[name], (el, name, value) => getState(el)[name] = value]
  })()),

  prop: createEffect('prop',
    (el) => el,
    (el, name) => el[name],
    (el, name, value) => el[name] = value
  ),

  attr: createEffect('attr', el => {
    let obj = {}
    for (let attr of el.attributes) obj[attr.name] = attr.value
    return obj
  }, (el, name) => {
      if (!attrCache.has(el)) {
        let observer = new MutationObserver(records => {
          for (let i = 0, length = records.length; i < length; i++) {
            let { target, oldValue, attributeName } = records[i];
            updateObservers(target, 'attr', attributeName)
          }
        })
        observer.observe(el, { attributes: true })
        attrCache.set(el, observer)
      }
      return el.getAttribute(name)
    },
    (el, name, value) => el.setAttribute(name, value),
    (a, b) => b + '' === a + ''
  ),

  html: function (...args) {
    // tpl string: html`<a foo=${bar}/>`
    let vdom
    if (args[0].raw) vdom = html(...args)

    else {
      // fn: html(h => h(...))
      if (typeof args[0] === 'function') vdom = args[0](h)

      // direct JSX: html(<a foo={bar}/>)
      else vdom = args[0]
    }

    if (!Array.isArray(vdom)) vdom = [vdom]

    this.forEach(el => patch(el, render, vdom))

    function render(arg) {
      if (!arg) return

      // numbers/strings serialized as text
      if (typeof arg === 'number') return text(arg)
      if (typeof arg === 'string') return text(arg)

      // FIXME: .length can be wrong check
      if (arg.length) return [...arg].forEach(arg => render(arg))

      // objects create elements
      let { tag, key, props, staticProps, children, use, is, effects = [] } = arg

      // fragment (direct vdom)
      if (!tag) return children.forEach(render)

      let el

      // <ul is="custom-el" />
      if (is) {
        function create() { return document.createElement(tag, { is }) }
        el = elementOpen(create, key, staticProps, ...props)
        children.forEach(render)
        elementClose(create)
      }

      // if (!children) el = elementVoid(tag, key, staticProps, ...props)
      else {
        el = elementOpen(tag, key, staticProps, ...props)
        children.forEach(render)
        elementClose(tag)
      }

      // plan aspects init
      if (use) (new $(el)).use(...use)

      // run provided effects
      for (let effect in effects) {
        $(el)[effect](effects[effect])
      }
    }

    return this
  },

  text: createEffect('text', el => el.textContent, (el, value) => el.textContent = value),

  class: createEffect('class', el => {
    let obj = {}
    for (let cl of el.classList) obj[cl.name] = cl.value
    return obj
  }, (el, name) => el.classList.contains(name), (el, name, value) => {
    if (!value) el.classList.remove(name)
    else el.classList.add(name)
  }),

  css: createEffect('css', (el) => {}, (el, name) => {}, (el, name, value) => {})
})


// register effect call, check deps, if changed - call destroy
function commit(key, deps, destroy) {
  if (deps !== undefined) {
    let prev = depsCache.get(key)

    if (Array.isArray(deps)) {
      if (equal(deps, prev)) return false
      depsCache.set(key, deps)
    }
  }

  if (destroyCache.has(key)) {
    let destroy = destroyCache.get(key)
    if (destroy && destroy.call) destroy.call()
  }
  destroyCache.set(key, destroy)

  return true
}

function fxKey () {
  let key

  // precompiled bundle inserts unique fxid before effect calls
  if (fxId) {
    key = tuple(currentElement, currentAspect, fxId)
    fxId = null
  }
  else {
    // stacktrace key is precise for
    if (isStacktraceAvailable) {
      // FIXME: exact stack is susceptible to babel-ish transforms
      let [fxKeysite, fxsite, callsite, ...trace] = parseStack((new Error).stack)
      let siteurl = callsite.file + ':' + callsite.lineNumber + ':' + callsite.column
      key = tuple(currentElement, currentAspect, siteurl)
    }
    // fallback to react order-based key
    else {
      key = tuple(currentElement, currentAspect, fxCount++)
    }
  }

  return key
}

function createEffect (effectName, get0, get, set, is = Object.is) {
  return function effect (...args) {
    // get()
    if (!args.length) {
      return get0(this[0])
    }

    // state(s => {...}, deps)
    if (typeof args[0] === 'function') {
      let fn = args.shift()
      let deps = args.shift()

      if (!commit(fxKey(), deps)) return false

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

      return true
    }

    // set(obj, deps)
    if (typeof args[0] === 'object' && !args[0].raw) {
      let [props, deps] = args

      if (!commit(fxKey(), deps)) return

      for (let name in props) {
        this[effectName](name, props[name], ...args)
      }
      return
    }

    // get(name)
    if (args.length == 1) {
      let name = args[0].raw ? String.raw(args.shift()) : args.shift()
      let el = this[0]

      let key = tuple(el, effectName, name)
      if (!observables.has(key)) observables.set(key, new Set)
      if (currentElement) {
        observables.get(key).add(tuple(currentElement, currentAspect))
      }

      return get(el, name)
    }

    // set(name, value)
    let [name, value, deps] = args
    if (!commit(fxKey(), deps)) return
    this.forEach(el => setNameValue(el, name, value))
  }

  function setNameValue(el, name, value) {
    let prev = get(el, name)

    if (is(prev, value)) return

    set(el, name, value)
    updateObservers(el, effectName, name)
  }
}


function h(target, props = {}, ...children) {
  let use, propsArr = []
  let staticProps = []
  let is, tag, classes = [], id, constructor

  if (typeof target === 'function') {
    tag = getTagName(target)
    constructor = getCustomElement(target)
  }

  // direct element
  else if (typeof target === 'string') {
    let [beforeId, afterId = ''] = target.split('#')
    let beforeClx = beforeId.split('.')
    tag = beforeClx.shift()
    let afterClx = afterId.split('.')
    id = afterClx.shift()
    classes = [...beforeClx, ...afterClx]
  }

  if (id) staticProps.push('id', id)
  if (classes.length) staticProps.push('class', classes.join(' '))

  // figure out effects: array props, anonymous aspects or child functions
  for (let prop in props) {
    let val = props[prop]
    // <div use=${use}>
    if (prop === 'use') use = Array.isArray(val) ? val : [val]

    if (prop === 'is') {
      // <div is=${fn}>
      if (typeof val === 'function') {
        is = getTagName(val)
        constructor = getCustomElement(val, tag)
        staticProps.push('is', is)
      }
      // <div is=name>
      // we don't touch that, user knows what he's doing
    }

    else propsArr.push(prop, val)
  }

  let key = id || (props && (props.key || props.id))

  // FIXME: use more static props, like type
  return {
    tag,
    key,
    use,
    is,
    constructor,
    props: propsArr,
    staticProps,
    children
  }
}




let nameCache = new WeakMap
const counters = {}
function getTagName(fn) {
  if (!fn.name) throw Error('Component function must have a name.')

  if (nameCache.has(fn)) return nameCache.get(fn)

  let name = paramCase(fn.name)

  // add num suffix to single-word names
  let parts = name.split('-')
  if (parts.length < 2) {
    if (!counters[name]) counters[name] = 0
    name += '-' + (counters[name]++)
  }

  nameCache.set(fn, name)

  return name
}


function getCustomElement(fn, ext) {
  let name = getTagName(fn)

  let ctor = customElements.get(name)
  if (ctor) return ctor

  let proto = ext ? Object.getPrototypeOf(document.createElement(ext)).constructor : HTMLElement
  let Component = createClass(fn, proto)

  customElements.define(name, Component, ext ? { extends: ext } : undefined)

  return Component
}

function createClass(fn, HTMLElement) {
  return class HTMLSpectComponent extends HTMLElement {
    constructor() {
      super()
      callAspect(this, fn)
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }
  }
}


export const SPECT_CLASS = '👁'


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

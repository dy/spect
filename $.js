import equal from 'fast-deep-equal'
import onload from 'fast-on-load'
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

attributes.class = applyAttr
attributes.is = (...args) => (applyAttr(...args), applyProp(...args))
attributes[symbols.default] = applyProp

let html = htm.bind(h)

const isStacktraceAvailable = true


export default function create(...args) { return new $(...args) }

const elCache = new WeakMap
class $ extends Array {
  constructor (arg, ...args) {
    super()

    if (elCache.has(arg)) return elCache.get(arg)

    // $(el|frag|text|node)
    if (arg instanceof Node) {
      this.push(arg)
      elCache.set(arg, this)
      return this
    }

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
    }
    else {
      this[0] = arg
    }
  }
}


const aspectsCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  observables = new WeakMap,
  stateCache = new WeakMap,
  attrCache = new WeakMap

let fxCount,
  currentElement,
  currentAspect

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
    let destroy = []
    this.forEach(el => {
      let aspects = aspectsCache.get(el)
      if (!aspects) aspectsCache.set(el, aspects = [])

      fns.forEach(fn => {
        if (aspects.indexOf(fn) < 0) {
          aspects.push(fn)
        }
      })
    })

    this.forEach(el => {
      aspectsCache.get(el).forEach(fn => {
        destroy.push(callAspect(el, fn))
      })
    })
  },

  fx: function (fn, deps, id) {
    fxCount++

    let key
    if (id === undefined) {
      if (!isStacktraceAvailable) {
        key = tuple(currentElement, currentAspect, fxCount)
      }
      else {
        let [fxsite, callsite, ...trace] = parseStack((new Error).stack)
        let siteurl = callsite.file + ':' + callsite.lineNumber + ':' + callsite.column
        key = tuple(currentElement, currentAspect, siteurl)
      }
    }
    // precompiled fx may generate unique id per-effect call
    else {
      key = tuple(currentElement, currentAspect, id)
    }

    if (deps !== undefined) {
      let prev = depsCache.get(key)

      // array dep - enter by change
      if (Array.isArray(deps)) {
        if (equal(deps, prev)) return this
        depsCache.set(key, deps)
      }
    }

    if (destroyCache.has(key)) {
      destroyCache.get(key).call()
    }
    destroyCache.set(key, () => destroy.forEach(fn => fn && fn()))

    let destroy = []

    Promise.resolve().then(() => {
      this.forEach(el => {
        let destructor = fn.call(el, el)
        destroy.push(typeof destructor === 'function' ? destructor : noop)
      })
    })
  },

  on: function (evts, delegate, fn) {
    if (typeof delegate === 'function') {
      deps = fn
      fn = delegate
      delegate = null
    }

    fxCount++
    let key = tuple(currentElement, currentAspect, fxCount)
    if (destroyCache.has(key)) destroyCache.get(key).call()
    destroyCache.set(key, () => destroy.forEach(fn => fn && fn()))
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

  mount: function () {
    fxCount++
    let key = tuple(currentElement, currentAspect, fxCount)
    if (destroyCache.has(key)) destroyCache.get(key).call()
    destroyCache.set(key, () => destroy.forEach(fn => fn && fn()))
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
    return [(...args) => args.length > 1 ? getState(args[0])[args[1]] : getState(args[0]), (el, name, value) => getState(el)[name] = value]
  })()),

  prop: createEffect('prop',
    (...args) => args.length > 1 ? el[args[1]] : el,
    (el, name, value) => el[name] = value
  ),

  attr: createEffect('attr', (...args) => {
      let [el, name] = args

      if (args.length < 2) {
        let obj = {}
        for (let attr of el.attributes) obj[attr.name] = attr.value
        return obj
      }

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

  text: createEffect('text', (el, name) => {}, (el, name, value) => {}),

  class: createEffect('class', (...args) => {
    if (args.length > 1) return el.classList.contains(args[1])

    let obj = {}
    for (let cl of el.classList) obj[cl.name] = cl.value
    return obj
  }, (el, name, value) => {
    if (!value) el.classList.remove(name)
    else el.classList.add(name)
  }),

  css: createEffect('css', (el, name) => {}, (el, name, value) => {})
})


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

function createEffect (effectName, get, set, is = Object.is) {
  return function effect (...args) {
    // get()
    if (!args.length) {
      return get(this[0])
    }

    // state(s => {...})
    if (typeof args[0] === 'function') {
      let result
      let fn = args[0]
      this.forEach((el, i) => {
        let draft
        let state = get(el)
        try {
          // Object.create is faster than assign
          draft = Object.create(state)
          if (!i) {
            result = fn(draft)
          } else fn(draft)
        } catch (e) { }

        Object.getOwnPropertyNames(draft).forEach(prop => {
          if (draft[prop] !== state[prop]) setNameValue(el, prop, draft[prop])
        })
      })

      return result
    }

    // set(obj)
    if (typeof args[0] === 'object' && !args[0].raw) {
      let props = args.shift()
      for (let name in props) {
        this[effectName](name, props[name], ...args)
      }
      return
    }

    // get(name)
    if (args.length == 1) {
      let name = args[0]
      let el = this[0]
      if (name.raw) name = String.raw(...args)

      let key = tuple(el, effectName, name)
      if (!observables.has(key)) observables.set(key, new Set)
      observables.get(key).add(tuple(currentElement, currentAspect))

      return get(el, name)
    }

    // set(name, value)
    let [name, value] = args
    this.forEach(el => setNameValue(el, name, value))
  }

  function setNameValue(el, name, value) {
    let prev = get(el, name)

    if (is(prev, value)) return

    set(el, name, value)
    updateObservers(el, effectName, name)
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

// min core, all effects are here

import $ from '../$'
import equal from 'fast-deep-equal'
import onload from 'fast-on-load'
import delegated from 'delegated'
import clsx from 'clsx'
import { paramCase } from './util.js'
import tuple from 'immutable-tuple'
import htm from 'htm'
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


const aspectsCache = new WeakMap,
  depsCache = new WeakMap,
  destroyCache = new WeakMap,
  observables = new Map,
  stateCache = new WeakMap

let fxCount,
  currentElement,
  currentAspect

function callAspect (el, fn) {
  let prevAspect = currentAspect,
    prevElement = currentElement

  fxCount = 0
  currentElement = el
  currentAspect = fn
  let result = fn.call(el)
  currentAspect = prevAspect
  currentElement = prevElement
  return result
}


function updateObservers(el, effect, path) {
  let key = tuple(el, effect, path)
  let observers = observables.get(key)
  let p = Promise.resolve()
  for (let [element, aspect] of observers) {
    p.then(() => callAspect(element, aspect))
  }
}


Object.assign($.fn, {
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

  fx: function (fn, deps) {
    fxCount++
    let key = tuple(currentElement, currentAspect, fxCount)

    if (deps !== undefined) {
      let prev = depsCache.get(key)

      // array dep - enter by change
      if (Array.isArray(deps)) {
        if (equal(deps, prev)) return this
        depsCache.set(key, deps)
      }
    }

    if (destroyCache.has(key)) destroyCache.get(key).call()
    destroyCache.set(key, () => destroy.forEach(fn => fn && fn()))
    let destroy = []


    Promise.resolve().then(() => {
      this.forEach(el => {
        destroy.push(fn.call(el, el))
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

  init: function (fn) {
    fxCount++
    let key = tuple(currentElement, currentAspect, fxCount)
    if (destroyCache.has(key)) return
    destroyCache.set(key, () => destroy.forEach(fn => fn && fn()))
    let destroy = []

    this.forEach(el => {
      destroy.push(fn.call())
    })
  },

  state: function (...args) {
    // get
    if (args.length == 1) {
      let name = args[1]
      let el = this[0]

      let key = tuple(el, 'state', name)
      if (!observables.has(key)) observables.set(key, [currentElement, currentAspect])

      if (!stateCache.has(el)) return
      return stateCache.get(el)[name]
    }

    // set(obj)
    if (typeof args[0] === 'object') {
      let props = args.shift()
      for (let name in props) {
        this.state(name, props[name], ...args)
      }
      return
    }

    // set(name, value)
    let [name, value] = args
    this.forEach(el => {
      let state = stateCache.get(el)
      if (!state) stateCache.set(el, state = {})

      if (Object.is(state[name], value)) return

      let prev = state[name]
      state[name] = value

      updateObservers(el, 'state', name)
    })
  },

  prop: function () {
    console.error('TO BE IMPL')
  },

  attr: function (...args) {
    // get
    if (args.length == 1) {
      let name = args[1]
      let el = this[0]

      let key = tuple(el, 'attr', name)
      if (!observables.has(key)) observables.set(key, [currentElement, currentAspect])

      if (!attrCache.has(el)) {
        this.forEach(el => {
          new MutationObserver(records => {
            for (let i = 0, length = records.length; i < length; i++) {
              let { target, oldValue, attributeName } = records[i];

              updateObservers(target, 'attr', attributeName)
            }
          }).observe(el, { attributes: true, attributeOldValue: true })
        })
      }

      return el.getAttribute(name)
    }

    // set(obj)
    if (typeof args[0] === 'object') {
      let props = args.shift()
      for (let name in props) {
        this.attr(name, props[name], ...args)
      }
      return
    }

    // set(name, value)
    let [name, value] = args
    this.forEach(el => {
      let prev = el.getAttribute(name)
      if (Object.is(prev, value)) return
      el.setAttribute(name, value)

      updateObservers(el, 'attr', name)
    })
  },

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

  text: function () {
    throw Error('TO BE IMPL')
  },

  class: function (...args) {
    this.forEach(el => {
      el.classList.value = clsx(el.classList, ...args)
    })
  },

  css: function () {
    throw Error('TO BE IMPL')
  }
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
export function getTagName(fn) {
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


export function getCustomElement(fn, ext) {
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

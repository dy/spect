// domdiff html implementation
import htm from 'htm'
import { isElement, isRenderable, paramCase, isPrimitive, isIterable } from './util'
import morph from 'morphdom'
import clsx from 'clsx'
import 'array-flat-polyfill'

const propsCache = new WeakMap()

let plannedComponentInit = null

const _morph = Symbol('morph')

export default function html(...args) {
  let prevUseCache = plannedComponentInit
  plannedComponentInit = new Set()

  // render DOM
  let result = htm.call(h, ...args) || document.createTextNode('')

  // non-DOM htm result to DOM
  if (isPrimitive(result)) result = document.createTextNode(result)
  else if (Array.isArray(result)) {
    // let frag = document.createDocumentFragment()
    // frag.append(...result)
    // result = frag
    result = html`<>${result}</>`
  }

  // seal result
  result[_morph] = false

  return result
}

function h(tag, props, ...children) {
  if (!props) props = {}

  // html`<.sel></>`
  if (typeof tag === 'string' && (tag[0] === '#' || tag[0] === '.')) {
    tag = document.querySelector(tag)
    if (!tag) return
  }

  // html`<${el}>...</>`
  if (isElement(tag)) {
    // html`<${el}.a.b.c />`
    for (let name in props) {
      let value = props[name]
      if (value === true && name[0] === '#' || name[0] === '.') {
        let [, id, classes] = parseTag(name)
        if (id && !props.id) props.id = id
        if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')
        delete props[name]
      }
    }

    // don't override initial tag id
    if (tag.id && !props.id) props.id = tag.id
    if (tag.classList && tag.classList.length && props.class) {
      props.class = [...new Set([...tag.classList, props.class])]
    }

    // keep attributes
    if (tag.attributes) {
      for (let attr of tag.attributes) {
        if (!(attr.name in props)) props[attr.name] = attr.value
      }
    }

    let newTag = createElement(tag.tagName || '', props, children)

    morph(tag, newTag, {
      getNodeKey: (el) => {
        return el.key || el.id
      },
      onBeforeElUpdated: (fromEl, toEl) => {
        // FIXME: this blocks updating
        // if (fromEl.isEqualNode(toEl)) {
        //   return false
        // }
        if (!toEl[_morph]) {
          fromEl.replaceWith(toEl)
          return false
        }

        if (propsCache.has(toEl)) {
          let changedProps = propsCache.get(toEl)
          for (let prop of changedProps) {
            if (!Object.is(fromEl[prop], toEl[prop])) {
              fromEl[prop] = toEl[prop]
              fromEl.dispatchEvent(new CustomEvent('prop:' + prop))
            }
            // propsCache.delete(prop)
          }
        }

        return true
      }
    })

    return tag
  }


  // html`<${C}/>`
  if (typeof tag === 'function') {
    let el = createElement(tag.name && paramCase(tag.name), props, children)

    return initComponent(el, tag)
  }


  // html`<>content...</>`
  let [tagName, id, classes] = parseTag(tag)
  if (id && !props.id) props.id = id
  if (classes.length) props.class = [props.class || '', ...classes].filter(Boolean).join(' ')

  let el = createElement(tagName, props, children)

  return el
}

function createElement(el, props, children) {
  if (!el) el = document.createDocumentFragment()
  else if (typeof el === 'string') {
    el = document.createElement(el, props && isPrimitive(props.is) ? { is: props.is } : undefined)
  }

  if (props) applyProps(el, props)

  if (children) {
    children = children
      .flat()
      .filter(child => typeof child === 'number' || child)
      .map(child => {
        if (isIterable(child)) {
          let frag = document.createDocumentFragment()
          frag.append(...child)
          return frag
        }

        if (isPrimitive(child)) return document.createTextNode(child)

        // clone textnodes to avoid morphing them
        if (child.nodeType === 3) return child.cloneNode()

        // functions
        if (typeof child === 'function') {
          child = child({ element: document.createDocumentFragment() })
          if (isRenderable(child)) return child
        }

        // async iterator is like continuous suspense
        if (child[Symbol.asyncIterator] || child[Symbol.iterator]) {
          let holder = isElement(child) ? child : document.createTextNode('')
          ;(async () => {
            for await (el of child) {
              el = html`${el}`
              holder.replaceWith(el)
              holder = el
            }
            // FIXME: there's possible mem leak
          })()
          return holder
        }

        // suspense is promise
        if (child.then) {
          child.then(el => {
            // FIXME: if holder is array, it can waste the position
            holder.replaceWith(el)
          })
          let holder = isElement(child) ? child : document.createTextNode('')
          return holder
        }

        return child
      })
  }

  if (children) el.append(...children)

  // internal nodes can be morphed
  el[_morph] = true

  if (el.is && typeof el.is === 'function') el = initComponent(el, el.is)

  return el
}

function applyProps(el, props) {
  for (let name in props) {
    let value = props[name]
    if (name === 'style') {
      if (typeof value === 'string') el.style.cssText = value
      else {
        for (let styleProp in value) {
          el.style.setProperty(styleProp, value[styleProp])
        }
      }
    }
    else if (name === 'class') {
      // FIXME: htm workaround to replace wrongly serialized falsey classes
      if (typeof value === 'string') {
        value = value.split(/\s+/).filter(cl => !/null|undefined|false/.test(cl))
      }
      el.className = clsx(value)
    }
    // html class props remnants
    else if (name[0] === '.' && value) {
      el.classList.add(name.slice(1))
    }
    else if (name.substr(0, 5) === 'data-') {
      el.setAttribute(name, value)
    }
    else {
      // FIXME: some attributes, like colspan, are not automatically exposed to elements
      if (isPrimitive(value) && isElement(el) && el.setAttribute && name !== 'href') {
        if (value === false || value === null || value === undefined) {
          el.removeAttribute(name)
        }
        else if (value === true) el.setAttribute(name, '')
        el.setAttribute(name, value)
      }

      // FIXME: some names, like hidden, clear up attributes (wrongly)
      if (name !== 'hidden') {
        el[name] = value
      }
      else {
        el[name] = value !== false
      }

      // collect use/is patch rendered DOM
      // FIXME: that should be a stream
      if (!propsCache.has(el)) propsCache.set(el, new Set)
      propsCache.get(el).add(name)
    }
  }
  return el
}

function parseTag(str) {
  if (typeof str !== 'string' && isIterable(str)) throw Error('Cannot handle iterables for now: ' + str)
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}


export function collectProps(el) {
  let props = {}
  let proto = el.constructor.prototype

  // custom non-prototype props
  for (let prop in el) {
    if (prop in proto) continue
    if (prop[0] === '_') continue
    props[prop] = el[prop]
  }

  // attributes
  if (el.attributes) {
    for (let attr of el.attributes) {
      if (!(attr.name in props)) props[attr.name] = attr.value
    }
  }

  // FIXME: collect from propsCache as well

  // FIXME: there can also be just prototype props modified

  return props
}

function initComponent(el, fn) {
  let props = collectProps(el)
  props.element = el

  let result = fn(props)
  if (result !== undefined && result !== el && isRenderable(result)) {
    let frag = html`<>${result}</>`
    result = frag.childNodes.length > 1 ? [...frag.childNodes] : frag.firstChild
    if (el.replaceWith) el.replaceWith(frag)
    el = result
  }

  // component initialized in html can be morphed
  el[_morph] = true

  return el
}

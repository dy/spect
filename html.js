import calc from './calc.js'
import fx, { primitive } from './fx.js'

const FIELD = '\ue000', QUOTES = '\ue001'
const TEXT_NODE = 3, ELEMENT_NODE = 1

// xhtm base supercharged with observables
export default function htm (statics) {
  let prev = 0, current = [], field = 0, name, value, quotes = [], quote = 0
  current.root = true

  // get string with fields, return observable state string
  const evaluable = (str, raw) => {
    let i = 0
    // if (!str[1] && str[0] === FIELD) return [arguments[++field]]

    const deps = []

    // text content keeps quotes
    str = str.replace(/\ue001/g, m => raw ? quotes[quote++] : quotes[quote++].slice(1, -1))
    str.replace(/\ue000/g, (match, idx, str) => {
        if (idx) deps.push(str.slice(i, idx))
        i = idx + 1
        return deps.push(arguments[++field])
      })
    if (i < str.length) deps.push(str.slice(i))

    // text content may have complicated inserts, like other observables etc
    if (raw) return deps

    // tagname / propname can be only a string
    return calc((...values) => {
      if (values.length === 1) return values[0]
      return values.filter(Boolean).join('')
    }, deps)
  }

  statics
    .join(FIELD)
    .replace(/('|")[^\1]*?\1/g, match => (quotes.push(match), QUOTES))
    .replace(/<!--.*-->/g, '')
    .replace(/\s+/g, ' ')
    // .replace(/^\s*\n\s*|\s*\n\s*$/g,'')

    // ...>text<... sequence
    .replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      let close, tag

      if (idx) {
        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (close) throw Error('Bad closing tag')
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              current = [current, tag = evaluable(part), []]
            }
            else if (part) {
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                current[2].push('...', arguments[++field])
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  current[2].push(evaluable(name), evaluable(value))
                }
                else {
                  current[2].push(evaluable(name), true)
                }
              }
            }
          })

        // create tag instantly, children will come up
        if (tag) {
          const props = current[2] = calc((...keyValue) => {
            const props = {}
            for (let i = 0; i < keyValue.length; i += 2) {
              let key = keyValue[i], value = keyValue[i+1]
              if (key === '...') Object.assign(props, value)
              else props[key] = value
            }
            return props
          }, current[2])

          // create changeable element from locating node in parent, cases:
          // - allocate existing node on hydration
          // - ?replace itself when the element changes?
          let currentEl
          current[1] = calc(tag => {
            // fixme: how much sense does it make to alloc here?
            // only hydrating existing target
            if (!currentEl) return currentEl = alloc(!current[0].root && current[0][1](), { tag, props: props() })
            if (typeof tag !== 'string' || tag.toLowerCase() !== currentEl.tagName.toLowerCase()) {
              let newNode = create({ tag, props: props() })
              // ensure children safety
              for (let i = 0; i < currentEl.childNodes.length; i++) appendChild(newNode, currentEl.childNodes[i])

              replaceWith(currentEl, currentEl = newNode)
            }
            return currentEl
          }, [current[1]])

          // reset/assign props when element or props list changes
          // FIXME: find out should we reset element attribs when element changes
          fx((el, props) => {
            let origProps = {}, origAttrs = {}

            for (let p in props) {
              let value = props[p]
              origProps[p] = el[p]
              el[p] = value
              if (el.getAttribute) {
                origAttrs[p] = attr(el, p)
                attr(el, p, typeof value === 'function' ? value() : value)
              }
            }

            // revert level to the initial state whenever it changes
            return () => {
              for (let p in origProps) {
                if (el.getAttribute) attr(el, p, origAttrs[p])
                el[p] = origProps[p]
              }
            }
          }, current.slice(1, 3))
        }

        if (close) {
          // trim unused content
          let el = current[1]()
          while (el.childNodes[el[_ptr]]) el.childNodes[el[_ptr]].remove()

          current[0].push(current)
          current = current[0]
        }
      }
      prev = idx + match.length
      if (prev < str.length || !idx) {
        if (text) {
          // children allocate nodes for themselves here
          // also, existing external ready-baked nodes must replace internals
          // argumentation: external nodes may have logic/listeners attached on them, whereas internals are just static hydration case
          const children = evaluable(text, true).map(child => {
            let el
            // FIXME: there can be an optimization for simple constants to avoid bunch of calcs
            return calc((child) => {
              if (!el) {
                el = alloc(current.root ? null : current[1](), child)
              } else {
                replaceWith(el, el = create(child))
              }
              return el
            }, [child, true]) // true guarantees sync init
          })
          current.push(...children)
        }
      }
    })

  let els = [], prevEl

  current.map(el => Array.isArray(el) ? el[1]() : el()).forEach(el => {
    // if (prevEl && prevEl.nodeType === TEXT_NODE && el.nodeType === TEXT_NODE) return prevEl.nodeValue += el.nodeValue
    // prevEl = el
    els.push(el)
    if (el[_group]) el[_group].map(el => els.push(el))
  })

  // FIXME: seems to be an outside/symptomatic effect
  if (!els.length) return document.createTextNode('')

  return els.length > 1 ? els : els[0]
}

function attr(el, p, value) {
  if (arguments.length === 2) {
    if (!el.hasAttribute(p)) return null
    value = el.getAttribute(p)
    if (value === '') return true
    return value
  }

  if (value === true) el.setAttribute(p, '')
  else if (value === false || value == null) el.removeAttribute(p)
  else el.setAttribute(p, value)
}

const _group = Symbol('group')
const _ptr = Symbol('ptr')

function create(arg) {
  if (arg == null) return document.createTextNode('')

  // can be text/primitive
  if (primitive(arg)) return document.createTextNode(arg)

  // can be node/fragment
  if (arg.nodeType) {
    // reset pointer - the element is considered re-allocatable
    arg[_ptr] = 0
    return arg
  }

  // can be an array / array-like
  if (Array.isArray(arg) || arg[Symbol.iterator]) {
    let marker = document.createTextNode('')
    marker[_group] = [...arg].flat().map(arg => create(arg))
    return marker
  }

  // function
  if (typeof arg === 'function') return create(arg())

  // can be { tag, props } object for tag creation
  if (typeof arg === 'object') {
    let { tag, props } = arg, el
    if (typeof tag === 'function') {
      el = create(tag(props))
    }
    else if (typeof tag !== 'string') el = create(tag)
    else {
      el = tag ? document.createElement(tag) : document.createDocumentFragment()
      if (props.id) el.id = props.id
    }
    return el
  }

  return arg
}

// locate/allocate node in parent node
function alloc(parent, arg) {
  // FIXME: avoid creating fake element here
  let el = create(arg)
  if (!parent) return el

  // track passed children
  if (!parent[_ptr]) parent[_ptr] = 0

  // look up for good candidate
  let nextNode = parent.childNodes[parent[_ptr]], match

  // if no available nodes to locate - append new nodes
  if (!nextNode) {
    appendChild(parent, el)
    return el
  }

  // FIXME: locate groups
  if (el[_group]) {
    // let nodes = []
    // for (let i = 0; i < el[_group].length; i++ ) nodes.push(alloc(parent, el[_group][i]))
    // return nodes
    insertBefore(parent, el, nextNode)
    return el
  }

  // find matching node somewhere in the tree
  for (let i = parent[_ptr]; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i]
    if (
      // same node
      node === el ||
      (node.isSameNode && node.isSameNode(el)) ||

      (node.tagName === el.tagName && (
        // same-key node
        (node.id && (node.id === el.id)) ||

        // same-content text node
        (node.nodeType === TEXT_NODE && node.nodeValue === el.nodeValue && !node[_group]) ||

        // just blank-ish tag matching by signature and no need morphing
        (node.nodeType === ELEMENT_NODE && !node.id && !el.id && !el.name && node.tagName === el.tagName && !el.childNodes.length)
      ))
    ) {
      match = node
      break
    }
  }

  // if there is match in the tree - insert it at the curr pointer
  if (match) {
    if (match !== nextNode) insertBefore(parent, match, nextNode)
    else parent[_ptr]++
    return match
  }

  insertBefore(parent, el, nextNode)
  return el
}


function appendChild(parent, el) {
  parent.appendChild(el)
  if (el[_group]) el[_group].map(el => parent.appendChild(el))
  parent[_ptr] += 1 + (el[_group] ? el[_group].length : 0)
}
function insertBefore(parent, el, before) {
  parent.insertBefore(el, before)
  if (el[_group]) {
    el[_group].map(gel => parent.insertBefore(gel, el))
    // swap group pointer to the beginning
    parent.insertBefore(el, el[_group][el[_group].length - 1])
  }
  parent[_ptr] += 1 + (el[_group] ? el[_group].length : 0)
}
function replaceWith(from, to) {
  if (from[_group]) from[_group].map(el => el.remove())

  if (to[_group]) {
    let frag = document.createDocumentFragment()
    frag.appendChild(to)
    to[_group].map(el => frag.appendChild(el))
    from.replaceWith(frag)
  }
  else {
    from.replaceWith(to)
  }

  return to
}

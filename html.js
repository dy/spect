import calc from './calc.js'
import fx from './fx.js'
import { primitive, getval } from './src/util.js'
import { updateChildren, updateAttributes } from './src/morph.js'

const FIELD = '\ue000', QUOTES = '\ue001'

// xhtm base supercharged with observables
export default function htm (statics) {
  let prev = 0, current = [], field = 0, name, value, quotes = [], quote = 0

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
      let close
      if (idx) {

        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              current = [current, evaluable(part), null]
            }
            else if (part) {
              let props = current[2] || (current[2] = [])
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                props.push('...', arguments[++field])
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  props.push(evaluable(name), evaluable(value))
                }
                else {
                  props.push(evaluable(name), true)
                }
              }
            }
          })

        if (close) {
          // current level length doesn't change
          let [parent, tag, props, ...children] = current
          tag = getval(tag)
          const el = tag.nodeType ? tag : !tag ? document.createDocumentFragment() : document.createElement(tag)

          if (props) observeProps(el, props)
          if (children.length) observeChildren(el, children)

          parent.push(el)
          current = parent
        }
      }
      prev = idx + match.length
      if (prev < str.length || !idx) {
        if (text) current.push(...evaluable(text, true))
      }
    })
  let els = current.map(nodify)
  return els.length > 1 ? els : els[0]
}

function observeProps(el, props) {
  // props morpher is independent from children for performance
  fx((...keyValue) => {
    const props = {}
    for (let i = 0; i < keyValue.length; i += 2) {
      let key = keyValue[i], value = keyValue[i+1]
      if (key === '...') Object.assign(props, value)
      else props[key] = value
    }

    // save orig children/props
    let origProps = {}, origAttrs = {}
    for (let p in props) {
      origAttrs[p] = el.getAttribute(p)
      origProps[p] = el[p]
    }

    // apply new props/children
    for (let p in props) {
      attr(el, p, props[p])
      el[p] = props[p]
    }

    // revert level to the initial state whenever it changes
    return () => {
      for (let p in origProps) {
        attr(el, p, origAttrs[p])
        el[p] = origProps[p]
      }
    }
  }, props, true)
}

function observeChildren(el, children) {
  // children morpher
  fx((...children) => {
    let frag = document.createDocumentFragment()
    children.map(child => child != null && frag.appendChild(nodify(child)))
    // morphing cases:
    // - initial hydration
    // - avoiding losing refs if html is used in regular non-reactive way
    updateChildren(frag, el)
  }, children, true)

  return el
}

function attr(el, p, value) {
  if (value === true) el.setAttribute(p, '')
  else if (value === false || value == null) el.removeAttribute(p)
  else el.setAttribute(p, value)
}

function nodify(child) {
  if (child == null) return
  // can be text/primitive
  if (primitive(child)) return document.createTextNode(child)
  // can be node/fragment
  if (child.nodeType) return child
  // can be an array
  if (Array.isArray(child)) {
    let frag = document.createDocumentFragment()
    child.forEach(child => frag.appendChild(nodify(child)))
    return frag
  }
  // function
  if (typeof child === 'function') return nodify(child())
  // an observable or other
  return getval(child)
}

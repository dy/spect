import calc from './calc.js'
import fx from './fx.js'
import store from './store.js'
import { primitive, getval } from './src/util.js'
import morph, { morphChildren } from './src/morph.js'

const FIELD = '\ue000', QUOTES = '\ue001'

// xhtm base supercharged with observables
export default function htm (statics) {
  let prev = 0, current = [null, document.createDocumentFragment(), null], field = 0, name, value, quotes = [], quote = 0

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
              let props = current[2] || (current[2] = store({}))
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                fx(obj => {
                  // FIXME: keys list must persist between updates
                  Object.assign(props, obj)
                }, [arguments[++field]], true)
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  fx((name, value) => {
                    // FIXME: changing name is bad practice. Waiting for the first bug.
                    props[name] = value
                  }, [evaluable(name), evaluable(value)], true)
                }
                else {
                  fx(name => {
                    // FIXME: changed name is bad practice.
                    props[name] = true
                  }, [evaluable(name)], true)
                }
              }
            }
          })

        if (close) {
          current[0].push(level(current))
          current = current[0]
        }
      }
      prev = idx + match.length
      if (prev < str.length || !idx) {
        if (text) current.push(...evaluable(text, true))
      }
    })

  let el = level(current)
  return el.childNodes.length > 1 ? el : el.childNodes[0]
}

function level(current, x) {
  let el

  fx((parent, tag, props, ...children) => {
    if (!el) {
      if (tag.nodeType) el = tag
      else el = !tag ? document.createDocumentFragment() : document.createElement(tag)
    }

    // save orig children/props
    let origProps = {}, origAttrs = {}
    for (let p in props) {
      origAttrs[p] = el.getAttribute(p)
      origProps[p] = el[p]
    }
    let origChildren = [...el.childNodes]

    // apply new props/children
    for (let p in props) {
      attr(el, p, props[p])
      el[p] = props[p]
    }

    let frag = document.createDocumentFragment()
    children.forEach(function add(child) {
      if (child == null) return
      // can be text/primitive
      else if (primitive(child)) frag.appendChild(document.createTextNode(child))
      // can be node
      else if (child.nodeType) frag.appendChild(child)
      // can be an array
      else if (Array.isArray(child)) child.forEach(child => add(child))
      // function/generatora
      else if (typeof child === 'function') add(child())
      // an observable or other
      else frag.appendChild(getval(child))
    })
    morphChildren(frag, el)

    // revert level to the initial state whenever it changes
    return () => {
      for (let p in origProps) {
        attr(el, p, origAttrs[p])
        el[p] = origProps[p]
      }
      while (el.firstChild) el.firstChild.remove()
      origChildren.map(child => el.appendChild(child))
    }
  }, current, true)

  return el
}

function attr(el, p, value) {
  if (value === true) el.setAttribute(p, '')
  else if (value === false || value == null) el.removeAttribute(p)
  else el.setAttribute(p, value)
}

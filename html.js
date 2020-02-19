import calc from './calc.js'
import fx from './fx.js'
import store from './store.js'
import { primitive, getval } from './util.js'

const FIELD = '\ue000', QUOTES = '\ue001'
const _parentNode = Symbol('parentNode')

// xhtm base supercharged with observables
export default function htm (statics) {
  let h = this, prev = 0, current = [], field = 0, args, name, value, quotes = [], quote = 0

  // simulate node
  current.appendChild = function (item) {
    item[_parentNode] = this
    this.push(item)
    return item
  }

  // get string with fields, return observable state string
  const evaluable = (str, textContent) => {
    let i = 0
    // if (!str[1] && str[0] === FIELD) return [arguments[++field]]

    const deps = []

    // text content keeps quotes
    str = str.replace(/\ue001/g, m => textContent ? quotes[quote++] : quotes[quote++].slice(1, -1))
    str.replace(/\ue000/g, (match, idx, str) => {
        if (idx) deps.push(str.slice(i, idx))
        i = idx + 1
        return deps.push(arguments[++field])
      })
    if (i < str.length) deps.push(str.slice(i))

    // text content may have complicated inserts, like other observables etc
    if (textContent) return deps

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
    .replace(/^\s*\n\s*|\s*\n\s*$/g,'')

    // ...>text<... sequence
    .replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      if (idx) {
        let close, tag, props

        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              // current = [current, evaluate(part), null]
              // FIXME: tag is not observable
              tag = getval(evaluable(part))
              if (!tag) { current.appendChild(current = document.createDocumentFragment()) }
              else {
                if (typeof tag === 'string') tag = tag.toUpperCase()
                // find first child matching the tag
                while (current.firstChild) {
                  if (current.firstChild !== tag && current.firstChild.tagName !== tag) current.firstChild.remove()
                }
                // if not found - create a new tag
                if (current.firstChild) current = current.firstChild
                else current.appendChild(current = typeof tag === 'string' ? document.createElement(tag) : tag)
              }
              tag = current
            }
            else if (part) {
              // let props = current[2] || (current[2] = {})
              if (!props) props = store({})
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                fx(obj => {
                  // FIXME: keys list must persist between updates
                  Object.assign(props, obj)
                }, [evaluable(part)], true)
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

        if (props) {
          // apply-diff collected props to complete tag
          fx(props => {
            for (let p in props) {
              const value = props[p]
              if (value === true) tag.setAttribute(p, '')
              else if (value === false || value == null) tag.removeAttribute(p)
              else tag.setAttribute(p, value)
              tag[p] = value
            }
          }, [props], true)
        }

        if (close) {
          // [current, tag, props, ...children] = current
          current = current[_parentNode] || current.parentNode
        }
      }
      prev = idx + match.length
      // if (prev < str.length || !idx) evaluate(text, part => current.push(part), true)
      if (prev < str.length || !idx) {
        if (text) {
          const deps = evaluable(text, true)
          const children = deps.flat().map(dep => current.appendChild(document.createTextNode('')))
          fx((...frags) => {
            frags.flat().map((frag, i) => {
              if (primitive(frag)) {
                if (children[i].nodeType !== 3) children[i].replaceWith(children[i] = document.createTextNode(''))
                children[i].textContent = frag
              }
              else {
                children[i].replaceWith(children[i] = frag)
              }
            })
          }, deps, true)
        }
      }
    })
  // return current.length > 1 ? current : current[0]
  return (current.length > 1) ? current : current[0]
}

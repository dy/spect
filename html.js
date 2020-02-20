import calc from './calc.js'
import fx from './fx.js'
import store from './store.js'
import { primitive, getval } from './src/util.js'
import morph from './src/morph.js'

const FIELD = '\ue000', QUOTES = '\ue001'
const _parentNode = Symbol('parentNode')
const _ptr = Symbol('ptr')

// xhtm base supercharged with observables
export default function htm (statics) {
  let prev = 0, current = list([null]), field = 0, args, name, value, quotes = [], quote = 0

  // simulate node
  // current.appendChild = function (item) {
  //   item[_parentNode] = this
  //   this.push(item)
  //   return item
  // }
  // current.childNodes = current
  // current[_ptr] = 0

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
    .replace(/^\s*\n\s*|\s*\n\s*$/g,'')

    // ...>text<... sequence
    .replace(/(?:^|>)([^<]*)(?:$|<)/g, (match, text, idx, str) => {
      if (idx) {
        let close

        str.slice(prev, idx)
          // <abc/> → <abc />
          .replace(/(\S)\/$/, '$1 /')
          .split(' ').map((part, i) => {
            if (part[0] === '/') {
              close = true
            }
            else if (!i) {
              current = list([current, evaluable(part), null])
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
          let el = h(getval(current[1]))
          current[0].push(el)

          // children number doesn't change
          fx((parent, tag, props, ...children) => {
            const newEl = morph(el, h(tag, props, ...children))
            if (newEl !== el) el.replaceWith(newEl)
          }, current, true);

          current = current[0]
        }
      }
      prev = idx + match.length
      if (prev < str.length || !idx) {
        if (text) {
          current.push(...evaluable(text, true))
        }
      }
    })

  // return current.length > 1 ? current : current[0]
  if (current.length > 2) {
    const frag = document.createDocumentFragment()
    frag.append(...current)
    return frag
  }
  return current[1]
}


export function h (tag, props, ...children) {
  tag = document.createElement(tag)

  for (let p in props) {
    tag.setAttribute(p, props[p])
  }

  tag.append(...children)

  return tag
}

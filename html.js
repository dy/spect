import calc from './calc.js'
import { changeable, primitive } from './util.js'

const FIELD = '\ue000', QUOTES = '\ue001'
const _parentNode = Symbol('parentNode')

export default function htm (statics) {
  let h = this, prev = 0, current = [], field = 0, args, name, value, quotes = [], quote = 0

  // simulate node
  current.appendChild = function (item) {
    item[_parentNode] = this
    this.push(item)
    return item
  }

  // TODO: turn string into an observable
  const evaluate = (str, keepQuotes) => {
    let i = 0
    if (!str[1] && str[0] === FIELD) return [arguments[++field]]

    // deps is fixed-length list of [possible] subscribables
    const deps = []
    str = str.replace(/\ue001/g, m => keepQuotes ? quotes[quote++] : quotes[quote++].slice(1, -1))
    str.replace(/\ue000/g, (match, idx, str) => {
        if (idx) deps.push(str.slice(i, idx))
        i = idx + 1
        return deps.push(arguments[++field])
      })
    if (i < str.length) deps.push(str.slice(i))

    return deps
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
              // current = [current, evaluate(part), null]
              calc(tag => {
                if (!tag) {
                  current.appendChild(current = document.createDocumentFragment())
                }
                else if (typeof tag === 'string') {
                  current.appendChild(current = document.createElement(tag))
                }
                else {
                  current.appendChild(current = tag)
                }
              }, evaluate(part))
            }
            else if (part) {
              // let props = current[2] || (current[2] = {})
              if (part.slice(0, 3) === '...') {
                // Object.assign(props, arguments[++field])
                // const p = arguments[++field]
                // fx((props) => {
                //   for (let prop in props) {
                //     current.setAttrubute(prop, p[prop])
                //   }
                // }, [props(arguments[++field])])
              }
              else {
                [name, value] = part.split('=')
                // props[evaluate(name)] = value ? evaluate(value) : true
                if (value) {
                  const el = current
                  calc((name, ...value) => {
                    const orig = el.getAttribute(name)

                    if (value.length === 1) value = value[0]
                    else value = value.filter(Boolean).join('')

                    if (value === true) el.setAttribute(name, '')
                    else if (value === false || value == null) el.removeAttribute(name)
                    else el.setAttribute(name, value)
                    el[name] = value

                    return () => {
                      el.setAttribute(name, orig)
                    }
                  }, [name, ...evaluate(value)])
                }
                else {
                  // fx(name => {
                  //   current.setAttrubute(name, '')
                  //   return () => {
                  //     current.removeAttribute(name)
                  //   }
                  // }, [evaluate(name)])
                }
              }
            }
          })

        if (close) {
          // [current, tag, props, ...children] = current

            current = current[_parentNode] || current.parentNode
        }
      }
      prev = idx + match.length
      // if (prev < str.length || !idx) evaluate(text, part => current.push(part), true)
      if (prev < str.length || !idx) {
        if (text) {
          const deps = evaluate(text, true)
          const children = deps.flat().map(dep => current.appendChild(document.createTextNode('')))
          calc((...frags) => {
            frags.flat().map((frag, i) => {
              if (primitive(frag)) {
                if (children[i].nodeType !== 3) children[i].replaceWith(children[i] = document.createTextNode(''))
                children[i].textContent = frag
              }
              else {
                children[i].replaceWith(children[i] = frag)
              }
            })
          }, deps)
        }
      }
    })
  // return current.length > 1 ? current : current[0]
  return (current.length > 1) ? current : current[0]
}

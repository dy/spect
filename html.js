import calc from './calc.js'
import fx from './fx.js'
import { primitive, getval } from './src/util.js'

const FIELD = '\ue000', QUOTES = '\ue001'

const _group = Symbol('group')

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
          current[2] = calc((...keyValue) => {
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
            // if (!currentEl) currentEl = alloc(parent, { tag, id: props.id })
            if (!currentEl) return currentEl = create(tag)
            let newNode = create(tag)
            currentEl.replaceWith(newNode)
            return currentEl = newNode
          }, [current[1]])
          if (!current[0].root) current[0][1]().appendChild(currentEl)

          // reset/assign props when element or props list changes
          // FIXME: find out should we reset element attribs when element changes
          fx((el, props) => {
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
          }, current.slice(1, 3), true)
        }

        if (close) {
          // trim unused content
          // let el = current.element()
          // while (el.firstChild) el.firstChild.remove()
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
            return calc(child => {
              if (!el) {
                el = createChild(child)
                if (!current.root) appendChild(current[1](), el)
              } else {
                replaceWith(el, el = createChild(child))
              }
              return el
            }, [child])
          })
          current.push(...children)
        }
      }
    })

  let els = current.map(el => Array.isArray(el) ? el[1]() : el())
  return els.length > 1 ? els : els[0]
}

function attr(el, p, value) {
  if (value === true) el.setAttribute(p, '')
  else if (value === false || value == null) el.removeAttribute(p)
  else el.setAttribute(p, value)
}

function create(tag) {
    if (!tag) return document.createDocumentFragment()
    if (tag.nodeType) return tag
    if (typeof tag === 'string') return document.createElement(tag)
    if (typeof tag === 'function') throw 'todo web-component'
    if (Array.isArray(tag)) throw 'todo list of elements'
}

function alloc(parent, tag, props) {
  if (!parent) {
    return create(tag, props)
  }

  // look up for good candidate
  let parentEl = parent.element(), ptr = parent.length - 3
  let i, nextNode = parentEl.childNodes[ptr], match

  // locate all elements of the array, return first tag with [_group] stash
  // if (Array.isArray(tag)) {
  //   let nodes = []
  //   for (let i = 0; i < tag.length; i++ ) nodes.push(alloc(parent, tag[i]))
  //   return nodes
  // }

  if (primitive(tag)) tag = document.createTextNode(tag)

  // if no available nodes to locate - append new nodes
  if (!nextNode) {
    parent[_ptr]++
    return parent.appendChild(tag)
  }

  // find matching node somewhere in the tree
  for (i = parent[_ptr]; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i]
    if (
      node === tag ||
      (node.isSameNode && node.isSameNode(tag)) ||
      (node.tagName === tag.tagName && (
        (node.id && (node.id === tag.id)) ||
        (node.nodeType === Node.TEXT_NODE && node.nodeValue === tag.nodeValue)
      ))
    ) {
      match = node
      break
    }
  }

 // if there is match in the tree - insert it at the curr pointer
  if (match) {
    if (match !== nextNode) parent.insertBefore(match, nextNode)
    parent[_ptr]++
    return match
  }

  if (!nextNode.id && !tag.id) {
    parent[_ptr]++
    return morph(nextNode, tag)
  }

  parent.insertBefore(tag, nextNode)
  parent[_ptr]++
}

function createChild(child) {
  if (child == null) return document.createTextNode('')
  // can be text/primitive
  if (primitive(child)) return document.createTextNode(child)
  // can be node/fragment
  if (child.nodeType) return child
  // can be an array
  if (Array.isArray(child)) {
    let marker = document.createTextNode('')
    marker[_group] = child.map(child => createChild(child))
    return marker
  }
  // function
  if (typeof child === 'function') return createChild(child())

  return child
}

function appendChild(root, el) {
  root.appendChild(el)
  if (el[_group]) el[_group].map(el => root.appendChild(el))
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

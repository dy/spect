import calc from './calc.js'
import fx from './fx.js'
import store from './store.js'
import { primitive, getval } from './util.js'

const FIELD = '\ue000', QUOTES = '\ue001'
const _parentNode = Symbol('parentNode')
const _ptr = Symbol('ptr')

// xhtm base supercharged with observables
export default function htm (statics) {
  let h = this, prev = 0, current = [], field = 0, args, name, value, quotes = [], quote = 0

  // simulate node
  current.appendChild = function (item) {
    item[_parentNode] = this
    this.push(item)
    return item
  }
  current.childNodes = current
  current[_ptr] = 0

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
              tag = evaluable(part)
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

        if (tag !== undefined) {
          tag = getval(tag)
          if (typeof tag === 'string') tag = !tag ? document.createDocumentFragment() : document.createElement(tag)
          if (props && props.id) tag.id = props.id
          current = tag = allocNode(current, tag)
          current[_ptr] = 0

          if (props) {
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
        }

        if (close) {
          // [current, tag, props, ...children] = current
          // trim unused content
          while (current.childNodes[current[_ptr]]) current.childNodes[current[_ptr]].remove()
          current = current[_parentNode] || current.parentNode
        }
      }
      prev = idx + match.length
      // if (prev < str.length || !idx) evaluate(text, part => current.push(part), true)
      if (prev < str.length || !idx) {
        if (text) {
          const deps = evaluable(text, true)
          const children = deps.map(dep => allocNode(current, getval(dep)))
          fx((...frags) => {
            frags.map((frag, i) => {
              children[i] = morph(children[i], frag)
            })
          }, deps, true)
        }
      }
    })

  // return current.length > 1 ? current : current[0]
  if (current.length < 2) return current[0]
  const frag = document.createDocumentFragment()
  frag.append(...current)
  return frag
}

// locate or allocate node. if `tag` is primitive - allocates text node, otherwise `tag` is either node or list of nodes
function allocNode(parent, tag) {
  let i, nextNode = parent.childNodes[parent[_ptr]], match

  // locate all elements of the array, return first tag with [_group] stash
  if (Array.isArray(tag)) {
    let nodes = []
    for (let i = 0; i < tag.length; i++ ) nodes.push(allocNode(parent, tag[i]))
    return nodes
  }

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

  return tag
}

// replace with regards to array-like insertions
function morph(from, to) {
  if (from && to && from.nodeType === to.nodeType && from.nodeType === Node.TEXT_NODE) {
    from.textContent = to.textContent
    return from
  }
  const placeholder = document.createTextNode('')
  if (Array.isArray(from)) {
    from[0].replaceWith(placeholder)
    from.map(node => node.remove())
  }
  else {
    from.replaceWith(placeholder)
  }

  from = placeholder

  if (Array.isArray(to)) {
    const parent = from.parentNode
    to = to.map(to => {
      if (primitive(to)) to = document.createTextNode(to == null ? '' : to)
      parent.insertBefore(to,  from)
      return to
    })
    from.remove()
  }
  else {
    if (primitive(to)) to = document.createTextNode(to == null ? '' : to)
    from.replaceWith(to)
  }

  return to
}

import { render as prender, h as hs } from 'preact'
import htm from 'htm'

// build vdom
export const html = htm.bind(h)



// render vdom into element
export function render(vdom, el) {
  if (typeof el === 'string') el = $$(el)
  else if (el instanceof Node) prender(vdom, el)
  else el.forEach(el => prender(vdom, el))
}



function h(tagName, props, ...children) {
  if (typeof tagName !== 'string') return hs(...arguments)

  if (!props) props = {}
  let [tag, id, classes] = parseTagComponents(tagName)
  if (!props.id) props.id = id
  if (!props.class) props.class = classes.join(' ')

  return hs(tag, props, ...children)
}

function parseTagComponents(str) {
  let tag, id, classes
  let [beforeId, afterId = ''] = str.split('#')
  let beforeClx = beforeId.split('.')
  tag = beforeClx.shift()
  let afterClx = afterId.split('.')
  id = afterClx.shift()
  classes = [...beforeClx, ...afterClx]
  return [tag, id, classes]
}


// turn function into a web-component
const _destroy = Symbol('destroy')
export function component(fn) {
  class HTMLCustomComponent extends HTMLElement {
    constructor() {
      super()
    }
    connectedCallback() {
      // take over attrs as props
      [...this.attributes].forEach(({ name, value }) => {
        this[name] = value
      })
      new Promise((ok) => {
        setTimeout(() => {
          ok()
          this[_destroy] = fn.call(this, this)
        })
      })
    }
    disconnectedCallback() {
      this[_destroy] && this[_destroy]
    }
  }

  return HTMLCustomComponent
}

import { html } from '.'
import { isIterable } from './util'

export default function $(selector, within=document) {
  if (selector.raw) {
    let el = document.createElement('_s')
    html`<${el}>${html(...arguments)}</>`
    return el.childNodes.length === 1 ? el.firstChild : el
  }

  if (isIterable(within)) within = within[0]
  if (selector[0] === '#') return within.querySelector(selector)

  return within.querySelectorAll(selector)
}


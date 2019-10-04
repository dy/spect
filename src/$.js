import { html } from '.'
import { isIterable, isElement } from './util'

export default function $(selector, within=document) {
  // $`<h/>`
  if (selector.raw) {
    let el = document.createElement('_s')
    html`<${el}>${html(...arguments)}</>`
    return el.childNodes.length === 1 ? el.firstChild : el
  }
  if (isElement(selector)) return selector

  if (isIterable(within)) within = within[0]
  if (selector[0] === '#') return within.querySelector(selector)

  return within.querySelectorAll(selector)
}


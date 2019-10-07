import html from './html'
import { isIterable, isElement } from './util'

export default function $(selector, within=document) {
  if (isElement(selector)) return selector
  if (isIterable(within)) within = within[0]
  if (selector[0] === '#') return within.querySelector(selector)

  return within.querySelectorAll(selector)
}


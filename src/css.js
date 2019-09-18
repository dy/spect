import { SPECT_CLASS, uid } from './util'
import scopeCss from 'scope-css'
import insertCss from 'insert-styles'

const cssClassCache = new WeakMap

export default function css (statics, ...parts) {
  let el = this && this[Symbol.for('spect.target')] || this

  let str = String.raw(statics, ...parts)

  let className = cssClassCache.get(el)

  if (!className) {
    className = `${SPECT_CLASS}-${uid()}`
    cssClassCache.set(el, className)
    el.classList.add(className)
  }

  str = scopeCss(str, '.' + className)
  insertCss(str, { id: className })

  return this
}

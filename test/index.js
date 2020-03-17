import './$.js'
import './h.js'
import './v.js'
import './o.js'
import './e.js'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let s = '<>'
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML
    })
    s+='</>'
    return s
  }
})

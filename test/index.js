// import './$.js'
// import './h.js'
import './v.js'

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

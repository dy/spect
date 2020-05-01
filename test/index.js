// import './$.js'
import './h.js'
// import './i.js'
// import './v.js'
// import './a.js'
// import './performance.js'
// import './diff.js'

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

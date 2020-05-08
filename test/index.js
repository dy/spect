// import './$.js'
// import './h.js'
// import './i.js'
// import './v.js'
// import './a.js'
import './performance.js'
// import './diff.js'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let s = '<>'
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : ''
    })
    s+='</>'
    return s
  }
})

Object.defineProperty(Element.prototype, 'innerHTMLClean', {
  get() {
    let ihtml = this.innerHTML
    return ihtml.replace(/<!---->/g, '')
  }
})

Object.defineProperty(Element.prototype, 'outerHTMLClean', {
  get() {
    let ohtml = this.outerHTML
    return ohtml.replace(/<!---->/g, '')
  }
})

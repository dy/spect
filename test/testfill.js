// test helpers
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
Object.defineProperty(DocumentFragment.prototype, 'innerHTML', {get() { return this.outerHTML.slice(2,-3) }})
Object.defineProperty(DocumentFragment.prototype, 'innerHTMLClean', {get() { return this.outerHTMLClean.slice(2,-3) }})
Object.defineProperty(DocumentFragment.prototype, 'outerHTMLClean', {
  get() {
    let s = '<>'
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : (n.outerHTMLClean != null ? n.outerHTMLClean : '')
    })
    s+='</>'
    return s
  }
})

Object.defineProperty(Element.prototype, 'innerHTMLClean', {
  get() {
    let ihtml = this.innerHTML
    return ihtml.replace(/<!--.*-->/g, '').replace(/\u200C/g, '')
  }
})
Object.defineProperty(Element.prototype, 'outerHTMLClean', {
  get() {
    let ohtml = this.outerHTML
    return ohtml.replace(/<!--.*-->/g, '').replace(/\u200C/g, '')
  }
})

export default null

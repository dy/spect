import './$.js'
// import './prop.js'
// import './attr.js'
// import './fx.js'
// import './on.js'
// import './core.js'
// import './readme.js'
// import './html.js'
// import './use.js'
// import './fx.js'
// import './is.js'
// import './state.js'
// import './class.js'
// import './mount.js'
// import './css.js'



Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let str = '<>'
    this.childNodes.forEach(el => str += el.nodeType === 3 ? el.textContent : el.outerHTML)
    str += '</>'
    return str
  }
})


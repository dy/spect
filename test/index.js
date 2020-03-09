import './$.js'
import './state.js'
import './on.js'
import './attr.js'
import './prop.js'
import './input.js'
import './fx.js'
import './calc.js'
import './from.js'
import './store.js'
import './list.js'
import './h.js'
import './html.js'
import './value.js'


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

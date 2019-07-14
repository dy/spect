// handling web-components
// mostly for html effect

export const components = new WeakMap

// register web component for an aspect function
export function createComponent(init, props, children) {
  if (!components.has(init)) {
    let tagName = dashcase(init.name)

    // TODO: handle simple components names, eg. name + '-'

    let Component = function (...args) {
      super(...args)
      this.attachShadow({ mode: 'open' })
    }

    // TODO: shadow root

    // TODO: extend from target HTML[N]Element
    // if (props.is)
    Component.prototype = Object.create(HTMLElement);

    // Component.prototype.connectedCallback
    // Component.prototype.disconnectedCallback
    // Component.prototype.adoptedCallback
    // Component.prototype.attributeChangedCallback(name, oldValue, newValue)

    // FIXME: move this to prototype
    // picks list of registered attr listeners, returns them
    Component.prototype.observedAttributes = () => {
      // let { attrs } = components.get(init)
      // return attrs
    }

    components.set(init, {
      tagName,
      init,
      attrs: []
    })

    customElements.define(tagName, Component)
  }

  return components.get(init)
}


function dashcase(str) {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, match => '-' + match.toLowerCase()).slice(1);
}

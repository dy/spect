# Spect

`Spect` is [Aspect-Oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) js library for building expressive UI code. It's designed with modern frontend practices in mind, looking at best/worst parts of existing frameworks and targeted for least boilerplate code possible.

Takes a bit more classical-flavored js with hooks power.

Principles:

- no bundling
- grounded html (progressive enhancement)
- natural hydration
- least non-standard solution
- max elegancy / expressiveness / as little boilerplate as possible
- max API consistency

_Aspect_ - a functional part, not necessarily linked to the main function [wikipedia](https://en.wikipedia.org/wiki/Aspect_(computer_programming)). Practically, aspects seems to have existed in DOM for a time already - as CSS, with stylesheet as "aspect", selectors as "pointcuts" and rules as "advice"; or as `hidden`, `contenteditable`, `title`, `autocapitalize` and other attributes. Step takes this concept one step forward, enabling generic aspects tooling?.

That turns out to provide elegant solution to many common frontend problems.

* visual effects (ripple, appearance, parallax, animations etc.)
* style properties (ui-box, tacjypns, layout polyfills etc.)
* a11y, l10n
* document side-effects (meta, header, dataschema)
* business-logic (authentication, authorization, accounting)
* connecting to store / providing data
* logging, context, etc.
* sound
* text formatting, typography
* additional rendering (portals)
* etc.

* :gem:

## Getting started

Spect can be connected directly to html bypassing bundling as:

```html
<script type="module">
import html from 'https://unpkg.com/spect@latest?module'

// your UI code
</script>
```

Or that can be connected the classical way as

<samp>npm i spect</samp>

```js
import $, * as fx from 'spect'
```

Let's see how [basic react examples](https://reactjs.org/) would look like built with spect:

### A simple aspect

Basic tool of spect is `html` function. It acts in a way, similar to hyperscript, but instantly renders html to "current level" container:

```js
import $, { html } from 'spect'

$(document.body, body =>
  html`<div id="hello-example" ${hello} name="Taylor"></div>`
)

// `hello` anonymous aspect
function hello({name}) {
  // html effect for #hello-example
  html`${name}`
}
```

### A stateful aspect

Spect introduces state and effects:

```js
import $, {html, state, mount} from 'spect'

// apply timer aspect to #timer-example
$('#timer-example', timer)

function timer(el) {
  // init defaults
  let { seconds = 0 } = state()

  // called on mount
  mount(() => {
    let i = setInterval(() => {
      // set state
      state({ seconds: seconds + 1 })
    }, 1000)

    // called on unmount
    return () => {
      clearInterval(i)
    }
  })

  html`Seconds: ${seconds}`
}
```

### An application

```js
import $, { html, state, on } from 'spect'

function Todo (el) {
  let {items=[], text=''} = state()

  // listens for `submit` event on current target
  on('submit', e => {
    e.preventDefault();
    if (!this.state.text.length) {
      return;
    }
    const newItem = {
      text: this.state.text,
      id: Date.now()
    };
    this.setState(state => ({
      items: state.items.concat(newItem),
      text: ''
    }))
  })

  // delegates event to #new-todo element
  on('change', '#new-todo' e => state({ text: e.target.value });

  html`
    <h3>TODO</h3>
    <main items=${items}>${TodoList}</main>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <input id=#new-todo value=${text}/>
      <button>
        Add #${items.length + 1}
      </button>
    </form>
  `
}

function TodoList ({items}) {
  html`
  <ul>
    ${items.map(item => `<li>${item.text}</li>`)}
  </ul>
  `
}

$(`#todos-example`, Todo)
```

### A component using external plugins

```js
import Remarkable from 'remarkable'
import $, { html, state } from 'spect'

function MarkdownEditor () {
  let {value='Hello, **world**!'} = state()

  let getRawMarkup = () => {
    const md = new Remarkable();
    return md.render(value);
  }

  html`
    <div class="MarkdownEditor">
      <h3>Input</h3>
      <label for="markdown-content">
        Enter some markdown
      </label>
      <textarea
        id="markdown-content"
        on-change=${e => state({value: e.target.value})}
        defaultValue=${value}
      />
      <h3>Output</h3>
      <div class="content">${el => el.innerHTML = getRawMarkup()}</div>
    </div>
  `
}

// mount MarkdownEditor aspect on `#markdown-example` element
$(`#markdown-example`, MarkdownEditor)
```


## Examples

[x][counter]
[ ][email validator]
[ ][TODO: TODO-app]()
[TODO: search resultt]
[TODO: form with validation]
[TODO: routing]
[TODO: authorization]
[TODO: i18n]
[TODO: suspense]
[TODO: slideshow]

[TODO: remount]
[TODO: react-use]
[TODO: context]
[TODO: ui-box]

[TODO: 2-seconds connect via unpackage module]
[TODO: connect as direct dependency]
[TODO: another good example, not too specific]

[TODO: Sound synthesiser as an aspect]()


[Material-components](https://github.com/material-components/material-components-web) example:

```html
<link href="https://unpkg.com/@material/ripple/dist/mdc-ripple.css" rel="stylesheet">
<script type="module">
  import spect from "https://unpkg.com/spect"
  import {MDCRipple} from 'https://unpkg.com/@material/ripple';

  // register ripple effect for all buttons on the page
  spect('button', el => {
    let ripple = new MDCRipple(el)
    el.classNames.add('mdc-ripple')

    return ripple.destroy
  }, [])
</script>

<button>Ripple</button>
```

Simulated canvas layers via DOM:

```js
spect('canvas.plot', canvas => raf(
  function render () {
    let ctx = canvas.getContext('2d')

    // clear canvas
    ctx.clearRect(0,0, canvas.width, canvas.height)

    // rerender all layers
    [...el.children].forEach(layer => {
      if (!(layer instanceOf CanvasLayer)) CustomElements.upgrade(layer, 'canvas-layer')

      layer.draw()
    })

    raf(render)
  }
  )
)
```



```html
<style>
@import "//unpkg.com/@material/textfield/mdc-text-field"
</style>

<script>
import mod, { htm, css, fx } from '//unpkg.com/@mod/core'

import { MDCRipple } from '//unpkg.com/@material/ripple'
import { MDCTextField } from `//unpkg.com/@material/textfield`

// register ripple effect for all elements with .mdc-ripple class on the page
// ( it raises a question of internal redundancy instantly that needs covering )
mod('.mdc-ripple', MDCRipple)

// create textField custom element based on material ui (following the docs)
let TextField = mod(el => {
  htm`<div class="mdc-text-field">
        <input type="text" id="my-text-field" class="mdc-text-field__input">
        <label class="mdc-floating-label" for="my-text-field">Label</label>
        <div class="mdc-line-ripple"></div>
      </div>`

  el.textField = new MDCTextField(el)
})
customElements.define('mdc-text-field', TextField, {extends: 'div'})
</script>

<body>
  <aside class="mod-sidebar"/>
  <main class="mod-page">
    <div class="logo mod-route"/>
    <nav class="mod-sticky"/>

      <article>
          <header class="mod-seo" data-seo="json">
            <h1 mod-typography="typo-settings">{page.title}</h1>
            <div mod-share/>
          </header>

          <section is="mod-intro"/>
          <feature><feature/><feature/>

          <footer class="mod-footer"/>
      </article>
    </main>
</body>
```


## API

Aspect side-effects are highly inspired by react hooks with changed API design for shorter notation.

* [ ] html
* [ ] css
* [ ] create
* [x] mount
* [ ] on
* [ ] fx
* [ ] intersect
* [ ] state
* [ ] attr
* [ ] prop
* [ ] query
* [ ] local
* [ ] remote


### `html(selector|element=currentElement, string|html|function)`

Assign an aspect function to all elements matching selector or direct elements.

Selector<sup>1</sup> can be:

* `element-name`: Select by element name.
* `.class`: Select by class name.
* `[attribute]`: Select by attribute name.
* `[attribute=value]`: Select by attribute name and value.
* `:not(sub_selector)`: Select only if the element does not match the sub_selector.
* `selector1, selector2`: Select if either selector1 or selector2 matches.

Aspect function takes element as the first argument and provides context for effects. It is similar to hooks-powered react render function, but treats html render as side-effect, not the result of the function.



### `mount(target=currentElement, callback)`

Called when the element is mounted on the DOM. The returned function is called when the element is unmounted.

```js
el => {
  mount(() => {
    // called when element is mounted

    return () => {
      // called when element is unmounted
    }
  })
}

el => {
  // called when the target is mounted
  mount('#target', () => {
    return () => {

    }
  })
}
```


### `state(target=currentTarget, value?)`

Component state hook. Provides per-element associated values:

```js
function mod (el) {
  // init/get state
  let { foo=default, bar } = state()

  // set state
  state({ foo: a, bar: b })
}
```

### `attr(target=currentTarget, value?)`

Same as `state`, but reads an attribute from the element, as well as registers listeners for the defined attribute. Any time attribute value changes, it triggers rerender.

```js
(el) => {
  // read attributes, register attr change listeners
  let { attrA=default, attrB } = attr()

  // write new attribute value
  attr({ attrA: a, attrB: b })
}
```

Note that attribute value must be a string, for non-string values use `prop` effect.


### `prop(target=currentTarget, value?)`

Similar to `attr` but reads element property. Can be used for communication between aspects.

```js
// first aspect
function aspectA (el) {
  let {foo=default, bar} = prop()
}

// second aspect
function aspectB (el) {
  let {foo} = prop()
  // foo === default
}

html`<div ${aspectA} ${aspectB} />`
```

### `query(value?)`

Same as `state`, but the value is reflected in `location.search` as `https://url.com/?param=value`.

```js
(el) => {
  let {param=default} = query()

  query({param: 'xyz'})
  // ?param=xyz
}
```

### `local(target=currentTarget, value?)`

Same as `state`, but persists value in localStorage.

```js
el => {
  // read value from local storage
  let {foo=default, bar} = local()

  // write to local storage
  local({foo: value})
}
```

### `remote` [pending...]

Same as local, but persists value in remote storage.

### `fx(handler, deps)` [unstable...]

Run side-effect function. Similar to react's `useEffect`, with some differences: `fx` can return value; `fx` has no destructor; handler can be async function; handler can be generator.

```js
function mod (el) {
  let result = fx(handler, deps?)

  // use fx to organize async request
  let result = fx(await () => {
    html'Pending...'
    let result = await doRequest()
    html`Result ${result}`
  })
}

```

### `on(target=currentTarget, event, handler)`

Attach or delegate event handler to the target element. No need to care about removing listeners - they're removed automatically when component is unmounted.

```js
el => {
  // add single event listener
  on('evt', handler)

  // attach multiple events
  on('evt1 evt2 evt3', handler)

  // delegate event to external element
  on('#el', 'click', handler)
}
```


### `css(target=currentElement, string)`

Apply css styles, scoped to target element.

```js
el => {
css`
:host {
}
:host .sub-element {
}
`

}
```

### intersects(target=currentElement, callback)

Invoked when element is visible in the screen.

### transition

Invoked per-transition.


## Plugins

* [spect-react]() - render react components in spect.
* [spect-redux]() - use state hooks, connected to redux store.
* [spect-gl]() - enable layers for gl-canvas element.
* [spect-a11y]() - enable a11y props for the element.
* [spect-dataschema]() - provide dataschema props for the element.
* [spect-meta]() - set document meta props.
* [spect-uibox]()


## Integration with react

Aspects are interoperable with react.

To connect aspect to react, just put aspect into `ref` prop:

```jsx
<App>
<div className="fps-indicator" ref={aspect}/>
</App>
```

But that's not even necessary - aspects can be added by selectors fully independent of react:

```
// spect
html('[app]', (el) => {})

// react
<div app>
</div>
```

To connect react component to spect, just use normal react render:

```js
import $ from 'spect'
import React from 'react'
import render from 'react-dom'
import App from './App.jsx'

html('.app', el => render(<App/>, el)
```


## Custom elements


## Microfrontends




## FAQ

### Why aspect, not component?


### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila




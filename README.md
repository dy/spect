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
[x][email validator]
[ ][TODO: TODO-app]()
[ ][TODO: search resultt]
[ ][TODO: form with validation]
[ ][TODO: routing]
[ ][TODO: authorization]
[ ][TODO: i18n]
[ ][TODO: suspense]
[ ][TODO: slideshow]

[ ][TODO: remount]
[ ][TODO: react-use]
[ ][TODO: context]
[ ][TODO: ui-box]

[ ][TODO: Sound synthesiser as an aspect]()


[Material-components](https://github.com/material-components/material-components-web) example:

```html
<link href="https://unpkg.com/@material/ripple/dist/mdc-ripple.css" rel="stylesheet">
<script type="module">
  import $, {mount} from "https://unpkg.com/spect"
  import {MDCRipple} from 'https://unpkg.com/@material/ripple';

  // register ripple effect for all buttons on the page
  $('button', el => {
    mount(() => {
      let ripple = new MDCRipple(el)
      el.classList.add('mdc-ripple')

      return ripple.destroy
    })
  }, [])
</script>

<button>Ripple</button>
```

Simulated canvas layers via DOM:

```js
$('canvas.plot', canvas =>
  prop({render})
  mount(() => {
    raf(render)
    return () => {

    }
  })
)

function render() {
  let ctx = canvas.getContext('2d')

  // clear canvas
  ctx.clearRect(0,0, canvas.width, canvas.height)

  // rerender all layers
  [...el.children].forEach(layer => layer.draw())

  raf(render)
}
```



```html
<style>
@import "//unpkg.com/@material/textfield/mdc-text-field"
</style>

<script>
import $, { htm, css, fx } from '//unpkg.com/spect'

import { MDCTextField } from `//unpkg.com/@material/textfield`

// create textField custom element based on material ui (following the docs)
function TextField(el) {
  mount(() => (
    html`<${el} class="mdc-text-field">
      <input type="text" id="my-text-field" class="mdc-text-field__input">
      <label class="mdc-floating-label" for="my-text-field">Label</label>
      <div class="mdc-line-ripple"></div>
    </>`,
    el.textField = new MDCTextField(el),
    () => {}
  ))
}
$('.mdc-text-field', TextField)
</script>
```


```html
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

* [ ] $(target, fn)
* [ ] html`content`
* [ ] css`style`
* [ ] create(() => destroy)
* [x] mount(() => unmount)
* [ ] on(evt, delegate?, handler)
* [ ] fx(fn, deps)
* [ ] intersect(fn, target?)
* [ ] state(value?)
* [ ] attr(value?)
* [ ] prop(value?)
* [ ] query(value?)
* [ ] local(value?)
* [ ] remote


### `$(selector|element, fn)`

Register a function listener (aspect) for elements, matching the selector, or direct element.

Selector<sup><a href="#ng-sel">1</a></sup> can have form:

* `element-name`: Select by element name.
* `.class`: Select by class name.
* `[attribute]`: Select by attribute name.
* `[attribute=value]`: Select by attribute name and value.
* `:not(sub_selector)`: Select only if the element does not match the sub_selector.
* `selector1, selector2`: Select if either selector1 or selector2 matches.

<sup id="ng-sel">1</sup> - selector syntax similar to angular selectors.

The aspect takes element as the only argument and provides context for effects.

```js
import $, { on } from 'spect'

// like jquery with react hooks
$('#button-container button', button => {
  on('click', evt =>
    $('#banner-message', msg => msg.classList.toggle('visible'))
  )
})
```

`$` returns the result of the aspect function.

<!-- Without an aspect `$` is just a shortcut for `document.querySelector`. -->


### ``html`markup` ``

HTML effect of aspect. Makes sure current element has provided markup.

```js
import $, { html, state } from 'spect'

// just like htm with aspects
function Logs(el) {
  let {show} = state()

  function toggle () {
    state({show: !show})
  }

  return html`
    <div class=logs ...${props}/>
      <button onclick=${toggle}>▼</button>
    ${
      show && html`
        <section class=logs-details>
          ${ logs.map(log => html`<${Log} ...${log}/>`) }
        </section>
      `
    }
    </div>
  `
}

function Log({ details, date }) {
  html`<p>${details}</p>`
}
```

If an element has own content, the `html` effect can be used as "reducer". For that purpose it provides `<...>` and `<#id>` tags.

```js
import $, { attr } from 'spect'

// enable `icon` attribute for all buttons
$('button[icon]', ({icon}) => html`<i class="material-icons">${icon}</i> <...>`

// show validator after the email input
$('.input-group', input => {
  let { value } = prop()
  html`<#email-input><div class=validate>${validate(value)}</div>`
})
```

### `mount(() => () => {})`

Called when the element is mounted on the DOM. The returned function is called when unmounted.

```js
el => {
  mount(() => {
    // called when element is mounted

    return () => {
      // called when element is unmounted
    }
  })
}
```


### `state(value?)`

Component state hook. Provides per-element associated values:

```js
function mod (el) {
  // init/get state
  let { foo=default, bar } = state()

  // set state
  state({ foo: a, bar: b })
}
```

### `attr(value?)`

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


### `prop(value?)`

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

### `local(value?)`

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

### `fx(fn, deps)`

Run side-effect function. Different from `useEffect` in:
- `fx` can return value
- `fx` has no destructor
- fn can be async function or generator
- fn may include inner effects
- fn can be run in unmounted state

```js
function aspect (el) {
  let result = fx(await () => {
    html'Pending...'
    let result = await doRequest(param)
    html`Result ${result}`
  }, [param])
}

```

### `on(event, delegate?, handler)`

Attach event handler. No care about removing listeners - they're removed automatically when component is unmounted.

```js
el => {
  on('submit', handler)

  // multiple events
  on('touchstart mousedown keydown', handler)

  // delegate to external element
  on('click', '#el', handler)
}
```


### ``css`styles` ``

Apply css styles, scoped to target element.

```js
el => {
css`
:host {
  background: red;
}
.sub-element {
  background: white;
}
`

}
```

### intersects(() => () => off)

Invoked when element is visible in the screen.


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


## Inspiration

`spect` would not be possible without brilliant ideas from many libraries authors, hence the acknowledge:

* react - for pains, hooks and jsx, grandiose job
* jquery - for old school
* htm - for belief in possibilities and parser code
* funkia/turbine - for examples and generators
* redux - for reducers
* tachyons, tailwindcss, ui-box - for CSS driving use-case
* evergreen-ui, material-ui - for many practical examples
* fast-on-load, selector-ovserver - for grounding selector observer solution
* reuse - for aspects hint
* material-design-lite - for upgrade code ground


### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila




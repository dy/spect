# Spect

`Spect` is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web-framework for creating expressive UIs. It provides essential DOM toolkit, separating cross-cutting concerns with [_aspects_](https://en.wikipedia.org/wiki/Aspect_(computer_programming)).

```js
import { $, html, state, fx, route } from 'spect'

// main app aspect
$('#app', app => {
  // current element state
  let { loading = false } = state()

  // matches current location
  let [ match, { id } ] = route('user/:id')

  // useEffect hook
  let data = fx(async () => {
    state({ loading: true })
    let data = await fetch(url)
    state({ loading: false })
    return data
  }, [id])

  // html effect
  html`${data}`
})

// loader aspect
$('#app.loader', app => {
  let { loading = false } = state()

  // acts like "HTML reducer"
  if (loading) html`${app.childNodes} <canvas class="spinner" />`
})
```

## Principles

1. Expressive, not impressive.
2. No building required to use framework.
3. No JS required to hydrate HTML.
4. Standard semantic HTML first.

<!--
TODO: to FAQ?

_Aspect_ - a functional part, not necessarily linked to the main function [wikipedia](https://en.wikipedia.org/wiki/Aspect_(computer_programming)). Practically, aspects seems to have existed in DOM for a time already - as CSS, with stylesheet as "aspect", selectors as "pointcuts" and rules as "advice"; or as `hidden`, `contenteditable`, `title`, `autocapitalize` and other attributes. Step takes this concept one step forward, enabling generic aspects tooling?.

That turns out to provide elegant solution to many common frontend problems.

TODO: where to list possible aspects?
TODO: motivate the usefulness of aspects by examples.
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
-->

## Contents

* Principles
* Installing
* Getting started
* Examples
* API
* Plugins
* FAQ


## Installing

_Spect_ that can be used as `npm` package:

[![npm install spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, html, state } from 'spect'

// ...your elegant UI code
```

Or that can be connected directly as module, skipping bundling step:

```html
<script type="module">
import { $, html, state } from 'https://unpkg.com/spect@latest?module'

// ...your expressive UI code
</script>
```

<!-- TODO: That can also be used the old way from CDN. -->


## Getting started

Let's build [basic examples](https://reactjs.org/) with _spect_.

### A simple aspect

The basic tool of _spect_ is `html` effect. It acts similar to hyperscript, but deploys html instantly to the aspected element:

```js
import { $, html } from 'spect'

$(document.body, body =>
  html`<div id="hello-example" class="hello" name="Taylor"/>`)
)

$('.hello', ({ name }) => html`Hello, ${name}!`)
```

Internally `html` is built on [htm](https://ghub.io/htm) and [snabbdom](https://ghub.io/snabbdom), providing performance and robustness.


### A stateful aspect

_Spect_ introduces `state`, `mount` and `fx` effects, similar to `useState` and `useEffect` hooks:

```js
import { $, html, state, mount, fx } from 'spect'

$('#timer-example', timer)

function timer(el) {
  // init defaults
  let { seconds = 0 } = state()

  // on mount
  mount(() => {
    let i = setInterval(() => {
      // set state
      state({ seconds: seconds + 1 })
    }, 1000)

    // on unmount
    return () => {
      clearInterval(i)
    }
  })

  html`Seconds: ${seconds}`
}
```

jQuery powered with react hooks.


### An application

Events subscription is provided by `on` effect, detaching callbacks from markup and enabling event delegation.

```js
import { $, html, state, on } from 'spect'

$(`#todos-example`, Todo)

function Todo (el) {
  let { items=[], text='' } = state()

  // listens for `submit` event on current target
  on('submit', e => {
    e.preventDefault();

    if (!text.length) return;

    const newItem = {
      text: this.state.text,
      id: Date.now()
    };

    state({
      items: [...items, newItem],
      text: ''
    })
  })

  // delegates event to #new-todo element
  on('change', '#new-todo', e => state({ text: e.target.value });

  html`
    <h3>TODO</h3>
    <main items=${items}>${TodoList}</main>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <input#new-todo value=${text}/>
      <button>
        Add #${items.length + 1}
      </button>
    </form>
  `
}

function TodoList ({ items }) {
  html`<ul>${items.map(item => `<li>${item.text}</li>`)}</ul>`
}
```

`on` effect unbinds listeners when aspect is detached from target. Note that the `on*` html attributes are supported as well.


### A web-component aspect

_Spect_ is also able to provide component aspects via native web-components mechanism.

```js
// editor.js
import { html, prop } from 'spect'
import Remarkable from 'remarkable'

export default function MarkdownEditor (el) {
  let { content = 'Hello, **world**!' } = prop()

  let getRawMarkup = () => {
    const md = new Remarkable();
    return md.render(content);
  }

  // obtain reference to `.content`
  let { lastChild: contentEl } = html`<host class=markdown-editor>
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content
      onchange=${e => prop({ content: e.target.value })}
    >${value}</textarea>

    <h3>Output</h3>
    <div.content/>
  </>`

  // look out for XSS
  lastChild.innerHTML = getRawMarkup()
}
```

```js
// index.js
import { $, html, state } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$(`#markdown-example`, el => html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

Remind [atomico](https://ghub.io/atomico).
Notice that due to snabbdom, spect allows shorthand id/classes notation in html as `<tag#id.class />`.

## Examples

[x][counter]
[x][email validator]
[ ][TODO: TODO-app]()
[ ][TODO: form with validation]
[ ][TODO: 7GUIs]
[ ][Material components]

<!--
[ ][TODO: search resultt]
[ ][TODO: routing]
[ ][TODO: authorization]
[ ][TODO: i18n]
[ ][TODO: suspense]
[ ][TODO: slideshow]

[ ][TODO: portals]
[ ][TODO: detailed explanation of html cases]
[ ][TODO: detailed explanation of fx cases]
[ ][TODO: useful plugins - i18n, form, route etc.]

[ ][TODO: remount]
[ ][TODO: react-use]
[ ][TODO: context]
[ ][TODO: ui-box]

[ ][TODO: Sound synthesiser as an aspect]()

[ ][TODO: edge cases, easter eggs: portals, snabbdom id/classname, web-components tricks, obtaining refs, performance hints, direct html use]
[ ][TODO: providing context to effects]
[ ][TODO: context-free effects use]
[ ][TODO: selectors in html effect, nested aspects etc.]
[ ][TODO: algorithm explanation]
[ ][TODO: https://github.com/sveltejs/svelte/tree/master/site/content/examples]


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

-->


## API

* [x] `$(selector|element, init => destroy)`
* [x] `mount(mount => unmount)`
* [ ] ``html`...markup` ``
* [ ] `state`

<!--
* [ ] css`style`
* [ ] fx(fn, deps?)
* [ ] on(evt, delegate?, fn)

* [ ] state(value?)
* [ ] attr(value?)
* [ ] prop(value?)
* [ ] query(value?)
* [ ] call(fn)

* [ ] update()
* [ ] destroy()

## Plugins

* [ ] local(value?)
* [ ] watch
* [ ] route
* [ ] isect(fn, target?)
* [ ] i18n
* [ ] resize
* [ ] perf

-->

### `$(selector|element, init => destroy)`

Attach selector observer or element handler to current target. `fn` result is used as destructor.

```js
import $, from 'spect'

// API
$('#my-selector', element => {
  console.log('init')
  return () => {
    console.log('destroy')
  }
})
```

#### Example

```js
import $, { on, state } from 'spect'

let hiddenBox = $('#banner-message');
$('#button-container button').on( 'click', e => {
  hiddenBox.classList.toggle( 'visible' )
});
```

You may wonder what's the difference with [jQuery](https://jquery.com/)?

− _Spect_ treats selector dynamically, so that it doesn't matter when the spect code is launched or if there are matching elements the DOM.

_For any elements matching the selector, ever attached to the DOM, `spect` runs the described handler function, called **aspect**._

---


### `mount(() => () => {})`

Mount effect invokes passed function when target is mounted to the DOM and invokes returned function when unmounted.

```js
$('#target', el => {
  mount(() => {
    console.log('element mounted')

    return () => console.log('element unmounted')
  })
})
```


<!-- API improvements -->

<!-- Without an aspect `$` is just a shortcut for `document.querySelector/all`. -->

<!-- Effect === aspect, <div mount=${() => () => {}}></div> -->

<!-- Effects exposed in jquery way: $(els).html(), but realtime via mutation observer -->

<!-- Empty selector cases for fragment construction: $(frag => {}), $().effect() -->

<!--
    Spect-based test-runner. t(name, fn => {}) is exactly the spect syntax. In fact, test is an aspect of some component.
    The cool thing: it can run asserts as effects.

    import t, {eq, deq} from 'spect/t'

    t('some-target-to-observe', target => {
      bench()
      eq(a, b)
      tick()

      fx()
    })
-->

<!--
### `create(() => () => {})`

Called whenever aspect is assigned / unassigned to an element:

```js
$(el, el => {
  create(() => {
    // aspect assigned
    return () => {
      // aspect unassigned
    }
  })
}
```

Note that an aspect can be assigned to existing elements, in that case `mount` will be triggered automatically.
-->

### ``html`...markup` ``

HTML effect builds provided DOM markup and makes sure that's mounted, performing necessary updates.

```js
import $, { html, state } from 'spect'

function Logs(el) {
  let {show} = state()

  function toggle () {
    state({show: !show})
  }

  html`<${el} class=logs ...${props}>
    <button onclick=${toggle}>▼</button>
    ${show && html`
      <section.logs-details>
        ${ logs.map(Log) }
      </section>`
    }
  </>`
}

const Log = ({ details, date }) => `<p>${details}</p><time>${ date.toLocalTimeString() }</time>`
```

Internally `html` uses [htm](https://ghub.io/htm) and [snabbdom](https://ghub.io/snabbdom) with `class`, `props`, `style`, `attributes`, `eventlisteners` and `dataset` modules.


<!--

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

### `fx(fn, deps?)`

Run side-effect function. Different from `useEffect` in:
- `fx` can return value
- `fx` has no destructor
- fn can be async function or generator
- fn may include inner effects
- fn can be run in unmounted state

```js
// as an aspect
(el) => {
  let result = fx(await () => {
    html'Pending...'
    let data = await doRequest(param)
    html`Result ${data}`

    return data
  }, [param])
}

// as a mod
$(el).fx(() => {
  log('Any update')
})
```

### `on(event, delegate?, fn?)`

Attach event handler. Listeners are removed automatically when component is unmounted.

```js
// as effect
el => {
  on('submit', fn)

  // multiple events
  on('touchstart mousedown keydown', fn)

  // delegate to external element
  on('click', '#el', fn)
}

// as modifier
$(el).on('click', '#el', fn)
```


### `css('styles')`

Apply css styles, scoped to target element.

```js
// as effect
$(el, () => css`
  :host {}
  .sub-element {}
`

// as modifier
$(el).css`
  :host {
    background: red;
  }
  .sub-element {
    background: white;
  }
`

// as aspect
html`
  <${target} css=${`
    :host {}
    .sub-element {}
  `}></>
`

```

### `intersects(() => () => off)`

Invoked when element is visible in the screen.

### `update()`

Simple effect triggering re-rendering.

```js
$('#clock', () => {
  let date = new Date()
  html`<time date=${date}>${date.toLocalTimeString()}</time>`
  setTimeout(update, 1000)
})
```

<small>Fixes react shallow `let [, update] = useState` anti-pattern.</small>


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





## FAQ

### Why aspect, not component?



### Why aspect, not custom elements?

[Hm](https://twitter.com/Rich_Harris/status/1141689227299737601).


### Microfrontends?


### Complexity?

Complexity of selectors is O(1) for id selectors and O(n) for class / general case selectors.


## Inspiration

`spect` would not be possible without brilliant ideas from many libraries authors, hence the acknowledge:

* react - for jsx, hocs, hooks and pains grandiose job
* atomico - for novative approach to custom-elements
* jquery - for old school ground
* htm - for belief that everything is possible and parser code
* funkia/turbine - for generators rendering and examples
* redux - for reducers
* tachyons, tailwindcss, ui-box - for CSS driving use-case
* evergreen-ui, material-ui - for many practical examples
* fast-on-load - for proving fast mutation observer solution
* [hui](https://github.com/hyperdivision/hui)
* selector-ovserver - for proving selector observer solution
* reuse - for aspects hint
* material-design-lite - for upgrade code ground
* God - for making this possible


### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila



-->

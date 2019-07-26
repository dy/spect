# Spect

`Spect` is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web-framework for creating expressive UIs.
It provides essential DOM toolkit, separating cross-cutting concerns with [_aspects_](https://en.wikipedia.org/wiki/Aspect_(computer_programming)).

```js
import { $, html, state, fx, route, prop } from 'spect'

// main app aspect
$('#app', app => {
  let [ match, { id } ] = route('user/:id')
  let { data } = state()

  fx(async () => {
    prop({ loading: true })
    state({ data: await fetch(url) })
    prop({ loading: false })
  }, [id])

  html`${data}`
})

// loader aspect
$('#app', app => {
  let { loading = false } = prop()
  if (loading) html`${app.childNodes} <canvas class="spinner" />`
})
```

### Principles

<ol>
<li id="principle-1"> Expressive, not impressive.
<li id="principle-2"> No bundling required.
<li id="principle-3"> No JS required to hydrate HTML.
<li id="principle-4"> Standard HTML first.
</ol>

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


## Install

**A.** As _npm_ package:

[![npm install spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, html, state } from 'spect'

// ...your UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import { $, html, state } from 'https://unpkg.com/spect@latest?module'

// ...your UI code
</script>
```
<!--
**C.** Or that can be used standalone from CDN.

TODO
```html
<script src="https://unpkg.com/spect@latest" crossorigin="anonymous"></script>
<script>
let { $, html, ...fx } = spect;
</script>
```
-->

## Getting started

Let's build [basic examples](https://reactjs.org/) with _spect_.

### A simple aspect

The basic tool of _spect_ is `html` effect. It acts similar to hyperscript, but deploys html instantly to the aspected element:


```js
import { $, html } from 'spect'

$(document.body, body =>
  html`<div id="hello-example" class="hello" name="Taylor"/>`
)

$('.hello', ({ name }) => html`Hello, ${name}!`)
```

<small>[Open in sandbox](https://codesandbox.com)</small>

<!-- Internally `html` is built on [htm](https://ghub.io/htm) and [snabbdom](https://ghub.io/snabbdom), providing performance and robustness. -->

<!--

### A stateful aspect · <small>code | sandbox</small>

_Spect_ introduces `state`, `mount` and `fx` effects, similar to `useState` and `useEffect` hooks:

```js
import { $, html, state, mount, fx } from 'spect'

$('#timer-example', el => {
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
})
```

> Hooks-powered jQuery.


### An application · <small>code | sandbox</small>

Events subscription is provided by `on` effect, decoupling callbacks from markup and enabling event delegation.

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


### A web-component <small>code | sandbox</small>

_Spect_ is also able to provide component aspects via native web-components mechanism.

```js
// editor.js
import { html } from 'spect'
import Remarkable from 'remarkable'

export default function MarkdownEditor ({ content='' }) {
  let getRawMarkup = () => {
    const md = new Remarkable();
    return md.render(content);
  }

  // obtain reference to `.content`
  html`<host class=markdown-editor>
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

  // look out for XSS!
  $('.content').innerHTML = getRawMarkup()
}
```

```js
// index.js
import { $, html, state } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$(`#markdown-example`, el => html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

Notice the shorthand id/classes notation as `<tag#id.class />`.
-->

## Examples

<!-- TODO: repl -->

<!-- * [x][counter] - source, sandbox
* [x][email validator] - source, sandbox
* [ ][TODO: TODO-app]() - source, sandbox
* [ ][TODO: form with validation] - source, sandbox
* [ ][TODO: 7GUIs] - source, sandbox
* [ ][Material components] - source, sandbox -->

<!-- [See all examples]() -->

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

[ ][TODO: explanation of html an effect, that can be called multiple times]

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

<!--
* [x] `$(selector|element, init => destroy) => el|els`
* [x] `mount(mount => unmount)`
* [ ] ``html`...markup` => el|els``
* [ ] ``css`...rules` => rules``
* [ ] `state(values?) => values`
* [ ] `fx(init => destruct, deps?) => result`
* [ ] `on(evt, delegate?, fn)`
* [ ] `prop(value?) => values`
* [ ] `query(value?) => values`
* [ ] `call(fn) => handle`
* [ ] `update()`
* [ ] `destroy(target, aspect)`
* [ ] `watch`
-->

### $(selector|element[s], init => destroy )

Attach aspect function `fn` to selected elements or direct element(s). The aspect is called on every matched element, taking it as a single argument.
Aspect can return destructor function, that is invoked when the aspect is detached from element.
<!-- `$` returns all `document.querySelector/All`, returning all matched elements in current aspect context. -->

```js
import $ from 'spect'

let element = $('#my-selector', element => {
  // init
  return () => {
    // destroy
  }
})
```

#### Example

<!-- ```js
import { $, on, state } from 'spect'

let hiddenBox = $('#banner-message');
$('#button-container button', el =>
  on('click', e => hiddenBox.classList.toggle( 'visible' ))
);
``` -->

<!-- TODO: explain context -->
<!-- TODO: explain destructor -->



### mount(attached => detached)

Mount effect invokes passed `attached` function when target is mounted on the DOM, and the optional returned function is called when the target is unmounted.

```js
$('#target', el => {
  mount(() => {
    // mounted
    return () => {
      // unmounted
    }
  })
})
```


<!-- API improvements -->

<!-- Effect === aspect, <div mount=${() => () => {}}></div> -->

<!-- Effects exposed in jquery way: $(els).html(), but realtime via mutation observer -->

<!-- Empty selector cases: $(frag => {}), $().effect() -->

<!-- Registering plugins as jQuery $.fn = ... -->

Note that an aspect can be assigned to existing elements, in that case `mount` will be triggered automatically.



### html\`...markup\`

HTML effect ensures markup for current element, performing necessary updates via DOM morhing. Returs node or nodes, created by the effect.

```js
import { $, html } from 'spect'

$('#target', el => {
  let div = html`<div#id.class foo=bar>baz</div>`

  // el.innerHTML ===
  // div.outerHTML ===
  // <div id="id" class="class">baz</div>
})
```

<!--
`html` is extension of [_htm_](https://ghub.io/htm) with the following:

- Anonymous attributes `<a ${foo} ${bar} />` for connecting aspects.
- Unclosed [self-closing tags](http://xahlee.info/js/html5_non-closing_tag.html), such as `<hr>`, `<br>` etc.
- [Optional closing tags](https://www.w3.org/TR/2014/REC-html5-20141028/syntax.html#optional-tags), such as `<li>`, `<p>` etc.
- Allows unquoted attribute values containing slashes.
- HTML reducer
-->

#### Attributes & properties

Attributes are set as element properties, the element decides if passed props should be exposed as _Node_ attributes.

```js
$(target, el => {
  let a = html`<a href='/' foo=bar>baz</>`
  // a.outerHTML === '<a href="/"></a>'
  // a.foo === 'bar'
})
```

#### Fragments

`html` supports multiple first-level elements in any way:

```js
$(target, el => {
  let [foo, bar, baz] = html`<>foo <bar/> baz</>`
  let [foo1, bar1, baz1] = html`foo <bar/> baz`
  let [foo2, bar2, baz2] = html(['foo ', html`<bar/>`, ' baz'])

  // el.innerHTML === `foo <bar></bar> baz`
})
```

#### DOM Elements

`html` can insert DOM nodes, which is useful for modification or reducing some existing markup:

```js
// wrap
$('#target', el => html`<div.prepended /> ${el.childNodes} <div.appended />`)

// prepend icons to buttons
$('button[icon]', ({
    attributes: { icon: { value: icon } },
    childNodes
  }) => html`<i class="material-icons">${ icon }</i> ${childNodes}`
)
```

`html` caches original `el.childNodes` on the first render, so that any subsequent render reuses the cached content:

```js
$(target, el => {
  html`<div.a>${el.childNodes}</div>`
  html`<div.a>${el.childNodes}</div>`
  html`<div.a>${el.childNodes}</div>`
  // el.innerHTML === `<div class="a">...</div>`
  // no recursion
})
```

<!-- TODO: For that purpose, the "reducer" tag can be used: `<div.a><...></div>` -->

#### Connecting aspects


#### Components

Components work via mechanism of custom-elements as:

```js
$(target, node => {
  html`<${Component}/>`
})

function Component(el) {
  html`<host foo=bar>baz</>`
}
```

<!--
#### JSX

TODO: reducing via JSX
`html` internally uses `html.h` function to build VDOM, which has hyperscript-compatible signature `h(tagName, props, ...children)`.

This way JSX can be used in `html` effect as:

```jsx
import { html } from 'spect'

/** @jsx html.h */
$('#target', target => {
  html(
    <>
      Text content
      <>Fragment</>
      <img/>
      <hr><br>
      <div id="id" {...[ foo, bar ]}></div>
      {el => { /* el === target */ }}
      <Component/>
      { let Target = document.querySelector('#id'); <Target>Selector portal</Target> }
      {/* comment */}
      { el.childNodes }
    </>
  )
})

function foo (el) {}
function bar (el) {}

function Component (el) {
  html(<host foo="bar">Shortcut for current target (el)</host>)
}

```

Also `html` internally uses `html.htm` and `html.render` functions, which are compatible with any virtual-dom machinery: preact, nanohtml + nanomorph, snabbdom, react, virtual-dom etc.
-->


<!--
#### Example

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
-->

<!--

### `state(value?)`

Provides state, associated with aspect. This way, different aspects can share

```js
function mod (el) {
  // init/get state
  let { foo=default, bar } = state()

  // set state
  state({ foo: a, bar: b })
}
```

---

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

---

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

---

### `query(value?)`

Same as `state`, but the value is reflected in `location.search` as `https://url.com/?param=value`.

```js
(el) => {
  let {param=default} = query()

  query({param: 'xyz'})
  // ?param=xyz
}
```

---

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

---

### `remote` [pending...]

Same as local, but persists value in remote storage.

---

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

---

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

---

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



-->

## Plugins

Official

* [ ] local(value?)
* [ ] watch
* [ ] route
* [ ] isect(fn, target?)
* [ ] i18n
* [ ] resize

Community

* [spect-react]() - render react components in spect.
* [spect-redux]() - use state hooks, connected to redux store.
* [spect-gl]() - enable layers for gl-canvas element.
* [spect-a11y]() - enable a11y props for the element.
* [spect-dataschema]() - provide dataschema props for the element.
* [spect-meta]() - set document meta props.
* [spect-uibox]()
* spect-raf
* spect-throttle


## FAQ

#### Portals

Portals can be organized via internal aspects:

```js
$(app, () => {
  html`Main content`

  let { portal = document.querySelector('#portal') } = state()

  $(portal, () => html`Portal content`)
})
```

<!--
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
-->

<!--
### Why aspect, not custom elements?

[Hm](https://twitter.com/Rich_Harris/status/1141689227299737601). -->
<!--

### Microfrontends?


### Performance?

Complexity of selectors is O(1) for id selectors and O(n) for class / general case selectors.
 -->

## Changelog

Version | Changes
---|---
1.0.0 | Register `spect` npm name


## Credits

_Spect_ would not be possible without brilliant ideas from many libraries authors, hence the acknowledge:

* react - for jsx, hocs, hooks and pains - grandiose job
* atomico, hui - for novative approach to web-components
* jquery - for classical school
* htm - for mainstream alternative example
* fast-on-load - for fast mutation observer solution
* tachyons, tailwindcss, ui-box - for CSS use-cases
* evergreen-ui, material-ui - for practical components examples
* reuse - for react-aspects solution
* selector-observer - for selector observer solution
* material-design-lite - for upgrading code example and components library
* funkia/turbine - for generators and examples
* *** - for letting that be possible

---

Made on Earth by your humble servant.

> Sat, Chit, Ananda, Vigraha
> Nama, Rupa, Guna, Lila


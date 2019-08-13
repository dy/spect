# Spect ![experimental](https://img.shields.io/badge/stability-experimental-red)

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) effectful framework for creating expressive UIs.


```js
import $ from 'spect';
import { route } from 'spect-router';
import { t, useLocale } from 'ttag';
import ky from 'ky';

// main aspect
function main (app) {
  let [ match, { id } ] = route('user/:id');
  if (!match) return;

  app.fx(async () => {
    app.state.loading = true;
    app.state.user = await ky.get(`./api/user/${id}`);
    app.state.loading = false;
  }, id);

  app.html`<p use=${i18n}>${
    app.state.loading ? `Hello, ${ app.state.user.name }!` : `Thanks for patience...`;
  }</p>`;
}

// preloader aspect
function preloader (el) {
  if (el.state.loading) el.html`${el.html} <canvas.spinner />`;
}

// i18n aspect
function i18n (el) {
  useLocale(el.attr.lang || $(document.documentElement).attr.lang);
  el.text = t`${ el.text }`;
}

// attach aspects to DOM
$('main#app').use(main, preloader);
```

## Principles

> 1. Expressive. <!-- not impressive, obvoius code -->
> 2. No bundling. <!-- required -->
> 3. JS-less hydration.
> 4. Standard HTML first.
> 5. Max utility. <!-- min presentation, min proving. -->

## Alchemy

:ferris_wheel: Reinvented wheel formula:
> _Spect_ ≈ _jQuery_ + _React hooks_.

The API is based on a set of modern framework practices (proxies, vdom/incremental-dom, htm, custom elements, hooks, observers, frp etc.), design research, experiments and proofs. Current design is third iteration.

<!--
Conceptually, app is a set of _reactions_ to changes in some _domain_.

_Reaction_ may have various side-_effects_, like changing html, css, page title, sound volume, displaying dialog etc. _React_ components provide main html side-effect per component, to provide other side-effects, the mechanism of hooks is introduced. In _jQuery_, any element may have an effect on any other element, but lack of component composition is 🍝.

_State_ can be any structure, representing some domain. In web, main domains are - data storage and DOM tree (besides navigation, web-audio, localstorage, webgl etc.). Reactions can be triggered by changes in these domains.

`$` function wraps any group of DOM nodes, providing connections to different domains - html, css, navigation, storage, events etc. The `fx` method serves as aspect for group, it works as `useEffect` merged with component renderer (component renderer conceptually _is_ effect too).

Other approaches include:

* Decomposition algorithm, aspects (CSS is aspect).
* streamlined html (fragment is container, attributes reflect domains, tagname is main domain indicator, children are implicit prop of syntax).
* streamlined effects (global is effect holder, effect scope is indicated in ref, effect corresponds to domain).
* streamlined subscription (autosubscribe to domain by reading it, sources of rerendering(target, subscriptions, direct gate call), soft/hard effects).
* optimization API equation (contextual effects → effect constructors → hooks namespace → html wrappers → events middleware).
* streamlined updates (batch updates after fx tick, clean up required diffs).
* streamlized html (orig holder, vdom, attaching fx, API, carrying over DOM nodes)
-->

## Install

**A.** As _npm_ package:

[![npm install spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import $ from 'spect'

// ...UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import $ from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```


## Getting started


🎬 Let's build [basic examples](https://reactjs.org/) with _Spect_.

### A simple aspect

This example creates _html_ in body and assigns single aspect to it.

```js
import { $ } from 'spect'

$(document.body).html`<div id="hello-example" class="hello" name="Taylor" use=${hello}/>`

function hello ($el) { $el.html`Hello, ${$el.attr.name}!` }
```

### A stateful aspect

_Spect_ introduces `state`, `mount` and `fx` effects, similar to `useState` and `useEffect` hooks:

```js
import $, { html, state, mount, fx } from 'spect'

$('#timer-example', el => {
  let { seconds = 0 } = state()

  mount(() => {
    // on mount
    let i = setInterval(
      () => state({ seconds: seconds + 1 }),
    1000)

    return () => clearInterval(i) // on unmount
  })

  html`Seconds: ${seconds}`
})

```
<small>[TODO: Open in sandbox](https://codesandbox.com)</small>


### An application

Events are provided by `on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes.

```js
import $, { html, state, on } from 'spect'

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

<small>[TODO: Open in sandbox](https://codesandbox.com)</small>

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
import $, { html, state } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$(`#markdown-example`, el => html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

Notice the shorthand id/classes notation as `<tag#id.class />`.


## API

<!-- Each effect reflects domain it provides shortcut to. -->

<!-- mount is a hook on html domain -->

:microscope: [**`$`**]()  [**`.use`**]()  [**`.state`**]()  [**`.html`**]()  [**`.fx`**]()  [**`.text`**]()  [**`.class`**]()  [**`.attr`**]()  [**`.on`**]()  [**`.css`**]()  [**`.init`**]()  [**`.mount`**]()


### `$( selector | els )` − elements selector

Select elements in DOM, provide domain methods for the selected set. The main purpose is shallow reference/wrapper for some nodes collection.

```js
$('#id.class > div')
$(document)
$(element)
$(elements)
```

<p align="right">Related: <a href="https://jquery.com">jquery</a></p>


### `.use( ...fns )` − aspects provider

Assign aspect function(s) to selected elements. Each `fn` is called for every element in the selected set, receiving wrapped element as single argument. Aspect `fn` can be be called multiple times in a frame, if `state`, `attr` or any other data source updates. The data sources are to subscribed to automatically when their values are read.


```js
let $outer = $`.outer`

$els.use($el => {
  // subscribe to attribute updates
  let x = $el.attr.x
  let y = $outer.attr.y

  // trigger on mount
  $el.on('connected', e => () => {})
})
```

Aspects can be attached via `.html` effect as well:

```js
$els.html`<div use=${$div => {}}></div>`
```

<p align="right">Related: <a href="https://ghub.io/reuse">reuse</a></p>


### `.fx( fn, ...deps? )` − side-effects provider

Register effect function for selected elements. The effect `fn` is called after current aspect call for each element in the set.

```js
// called each time
$target.fx(() => {})

// called once
$target.fx(() => {}, [])

// called any time deps change
$target.fx(() => {}, deps)

// destructor
$target.fx(() => () => destroy(), deps)
```

<p align="right">Related: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `.state` − element state provider

Read or write state, associated with an element. Read returns state of the first item in the set. Reading state subscribes current aspect to rerender whenever that state changes.

```js
// write state
$target.state = obj
$target.state.x = 1
$target.state({x: 1})
$target.state(_ => _.x.y.z = 1) // safe path setter

// read state
$target.state.x
$target.state(_ => _.x.y.z) // safe path getter
```

<p align="right">Related: <a href="https://reactjs.org/docs/hooks-state.html">useState</a>, <a href="https://www.npmjs.com/package/icaro">icaro</a>, <a href="https://www.npmjs.com/package/introspected">introspected</a></p>


### `.html` − markup provider

Provides HTML content for elements.

```js
// set inner html
$target.html`...markup`
$target.html(vdom)
$target.html = vdom | `...markup`
$target.html(html => html`...markup ${ html`...inner` }`)

/* @jsx $ */
$target.html = <>Markup</>

// get html
$target.html
```

#### Components

`html` effect provides ways to assign aspects directly to components or turn elements into custom elements.
For that purpose, `is` attribute can be used with an aspect as a component constructor:

```js
$els.html`<button is=${SuperButton}></button>`
$els.html`<${SuperButton} />`

function SuperButton($el) {
  // ...
}
```

#### Examples

* [Popup-info example from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):


<p align="right">Related: <a href="https://ghub.io/incremental-dom">incremental-dom</a>, <a href='https://ghub.io/htm'>htm</a></p>


### `.text` − text content provider

Provide text content for group of elements.

```js
// set text
$target.text`...text`
$target.text = `...text`
$target.text('...text')
$target.text(nodes => (nodes[2] = '...text', nodes))

// get text
$target.text
```


### `.css` − style sheets provider

Provide scoped CSS styles for element

```js
// write css
$target.css`selector { ...rules }`
$target.css = `selector { ...rules }`
$target.css({ rule: styles })
$target.css(rules => modifiedRules)
$target.css.path = obj|str

// read css
$target.css
$target.css.path // obj
```

<p align="right">Related: <a href="https://ghub.io/virtual-css">virtual-css</a></p>


### `.class` − classes provider

Changes element classList, updates all dependent elements/aspects.

```js
// write classes
$target.class`foo bar baz`
$target.class = `foo bar baz`
$target.class = {foo: true, bar: false, baz: () => false}
$target.class(({ foo, bar, ...clsx }) => clsx)

// read classes
$target.class // { foo: true, bar: true }
$target.class.foo // true
```

<p align="right">Related: <a href="https://ghub.io/clsx">clsx</a>, <a href="https://ghub.io/classes">classes</a></p>


### `.attr` − attributes provider

Changes element attributes, updates all dependent elements/aspects.

```js
// write attributes
$target.attr`foo bar baz`
$target.attr = `foo bar baz`
$target.attr = {foo: true, bar: false, baz: () => false}
$target.attr(({ foo, bar, ...clsx }) => clsx)

// read attributes
$target.attr // { foo: true, bar: true }
$target.attr.foo // true
```

<p align="right">Related: <a href="https://ghub.io/attributechanged">attributechanged</a></p>


### `.on` − events provider

Registers event listeners for a target, scoped to current aspect.

```js
// write events
$target.on('foo bar', e => {})
$target.on.foo = e => {}
$target.on = { foo: e => {} }

// read events
$target.on // { foo: e => {}, bar: e => {} }
$target.on.foo // e => {}
```

`on` provides `connected` and `disconnected` events for all aspects.

```js
$target.on('connected', e => {

})
```

<p align="right">Related: <a href="https://github.com/donavon/use-event-listener">use-event-listener</a></p>


### `.init( fn: create => destroy )` - init / destroy lifecycle callbacks

Triggered during the first render, useful to initialize component state and other effects. Any effects or changes made in callback are muted, so rerendering won't trigger, unlike in effect `.fx( fn, [] )`.

```js
$('#target').use($el => {
  $el.init(() => {
    // ...create / init

    $el.state.x = 1
    $el.state.y = 2
    let i = setInterval(() => {})

    return () => {
      // ...destroy

      clearInterval(i)
    }
  })
})
```

### `.mount( fn: onmount => onunmount )` - connected / disconnected lifecycle callbacks

Triggers callback `fn` when element is connected to the DOM. Optional returned function is triggered when the element is disconnected.
If an aspect is attached to mounted elements, the `onmount` will be triggered automatically.

```js
$('#target'.use($el => {
  $el.mount(() => {
    // connected
    return () => {
      // disconnected
    }
  })
})
```

<!--

## Plugins

* [spect-route]() - provide global navigation effect.
* [spect-request]() - async request provider.
* [spect-observe]() - selector observer.
* [spect-isect]() - intersection observer.

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
* [spect-uibox]() -->


<!--
## FAQ

### Portals?

```js
$(portal).html`Portal content`
```

### JSX?

```js
/* @jsx h */
$el.html =  <div>Inner content</div>
```

### Wrap content?

```js
$el.html`Wrap outer <div>${ $el }</div>` // $el contains different nodes list!
$el.html`Wrap inner <div>${ $el.children }</div>` // $el is the same
```

### Code splitting?

Aspects can naturally be split to upgradable parts of html, enabling progressive-enhancement principle and reducing network load:

```html
<script>
import $ from 'unpkg.com/spect'

$('#app').is($app => {

})

</script>

<script>
import $ from 'unpkg.com/spect'

// i18n aspect
$('.t').use(i18n)

function i18n () {

}
</script>
```

### Concurrent hydration?

That's built-in.

### Use, is, fx - what's the difference?

`is` provides single main aspect for an element via mechanism of web-components, if that's available. `is` aspect is always called first when element is updated.

`use` provides multiple secondary aspects for an element, called in order after the main one. `use` doesn't use custom elements for rendering themselves.

Both `is` and `use` are rendered in current animation frame, planning rerendering schedules update for the next frame.

`fx` provides a function, called after current aspect call. It is called synchronously in sense of processor ticks, but _after_ current renering aspect. Ie. aspect-less `fx` calls will trigger themselves instantly.

### Microfrontends?

### Performance?
-->

<!-- ## Acknowledgement


_Spect_ would not be possible without brilliant ideas from many libraries authors, hence the acknowledge to authors of _jquery_, _react_, _atomico, hui_, _htm_, _fast-on-load_, _tachyons, tailwindcss, ui-box_, _evergreen-ui, material-ui_, _reuse_, _selector-observer_, _material-design-lite_, _funkia/turbine_ and others. -->

<!-- * _***_ - for letting that be possible. -->

##

<p align="right">HK</p>

<!--
<p align="center">Made on Earth by your humble servant.

<p align="center"><em>Sat, Chit, Ananda, Vigraha.</em><br/><em>Nama, Rupa, Guna, Lila.</em></p> -->

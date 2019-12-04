# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Aspect-oriented UI libary. _Spect_ provides minimal abstraction to organize web-apps in aspect-oriented fashion.

<!-- Incorporates  [aspect-oriented programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), FRP and streams. -->

<!-- #### 🎡 Concept

_Spect_ introduces _reactive functional effects_ with domain accessors to declare dependencies: `$`, `attr`, `html`, `css`, `state`, `data`, `prop`, `on` etc. Less words, more business: -->

<!-- #### 🏛️ Principles

1. Expressivity.
2. No bundling.
3. HTML first.
3. Organic hydration.
5. Max utility, min presentation. -->

<!-- Spect is build with a set of modern practices in mind (proxies, symbols, tagged strings, virtual dom, incremental dom, htm, custom elements, hooks, observers, tuples, frp). It grounds on API design research, experiments and proofs. Current API is 4th iteration. -->

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


<!--
```js
import spect from 'spect'
import { useAttribute, useRoute, useStore, useEffect } from 'unihooks'
import { t, useLocale } from 'ttag'
import { html, render } from 'lit-html'

// main app
spect('#app', element => {
  // loading data when location changes
  let [{ id }] = useRoute('users/:id')
  let [user, setUser] = useStore('user', { id: null, name: null, })
  let [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setUser(await fetch(`user/${id}`))
    setLoading(false)
  }, [id])

  render(html`
    <p>${ !loading ? `Hello, ${ user.name }!` : `Thanks for patience...` }</p>
  `, element)
}

// preloader aspect stream
spect('.preloadable', el => {
  let content = useMemo(() => [...el.childNodes]),
      progress = html`<progress class="progress-circle" />`
  let [loading] = useAttribute(el, 'loading')

  render(loading ? content : progress, el)
})

// i18n aspect stream
spect('.i18n', el => {
  let str = useMemo(() => this.textContent)
  let [lang, setLang] = useAttribute(document.documentElement, 'lang')
  useLocale(lang)

  render(t(str), el)
})
```
-->

## Installation

<!-- **A.** As _npm_ package: -->

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, fx, on, prop } from 'spect'

// ...UI code
```

<!-- **B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import { use, fx, on } from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```

**C.** As standalone bundle:

```html
<script src="https://unpkg.com/spect/dist-umd/index.bundled.js"></script>
<script>
  let { fx, on } = window.spect

  // ...UI code
</script>
``` -->

<!--
## Getting started

🎬 Let's build [react examples](https://reactjs.org/).

### A Simple Selector Stream

This example assigns handler to `#hello-example` element and observes its `name` property, rerendering content.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import spect from 'spect'

spect('#hello-example', props => {
  return <this>
    <div class="message">
      Hello, { props.name }!
    </div>
  </this>
})
```

This is example of simple timer: it handles `connected` and `disconnected` event streams, as well as runs side-effect via `fx`, that is triggered whenever any input stream (`prop`) emits new value.

```js
import spect from 'spect'

// for every #timer-example element
spect('#timer-example', async el => {
  let state = { seconds: 0 }

  // start timer when connected, end when disconnected
  on(el, 'connected', e => {
    let i = setInterval(() => {
      state.seconds++
    }, 1000)

    on(el, 'disconnected', () => clearInterval(i))
  })

  // rerender when seconds change
  fx(prop(state, 'seconds'), seconds => html`<${el}>Seconds: ${seconds}</>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


### An Application

Selector streams allow easily assign aspects to elements.

```js
import spect from 'spect'

spect('#todos-example', el => {
  let state = { items: [], text: '' }

  // run effect by submit event
  on(el, 'submit', e => {
    e.preventDefault()

    if (!state.text.length) return

    state.items = [...state.items, { text: state.text, id: Date.now() }]
    state.text = ''
  })

  // rerender html when state changes
  prop(state, 'items', items => {
    html`<${el}>
    <h3>TODO</h3>
    <main#todo-list items=${ items }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <br/>
      <input#new-todo onchange=${ e => state.text = e.target.value}/>
      <button>
        Add #${ items.length + 1}
      </button>
    </form>
  </>`
  })
})

spect('#todo-list', el => {
  prop(el, 'items', items => html`<${el}><ul>${items.map(item => html`<li>${item.text}</li>`)}</ul></>`)
})

```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

The _html_ syntax is extension of [htm](https://ghub.io/htm), enabling rendering / creating / patching real DOM.
Can be replaced with [lit-html](https://ghub.io/lit-html).

```js
// index.js
import spect from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
spect('#markdown-example', el => html`<${el}><${MarkdownEditor} content='Hello, **world**!'/></el>`)
```

```js
// editor.js
import { prop, state, html } from 'spect'
import { Remarkable } from 'remarkable'

function MarkdownEditor({ element, content }) {
  let state = { value: content }

  prop(state, 'value', (value) => {
    html`<${element}.markdown-editor>
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content onchange=${e => state.value = e.target.value }>${ value }</textarea>

    <h3>Output</h3>
    <div.content innerHTML=${ getRawMarkup(value)} />
    </>`
  })
}

let getRawMarkup = content => {
  const md = new Remarkable();
  return md.render(content);
}
```

<p align='right'><a href="https://codesandbox.io/s/a-component-tnwdm">Open in sandbox</a></p>

-->

<!--
### More examples

* [Popup-info component from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):
-->



## Documentation

<!-- [**`$`**](#use-el--destroy--deps---generic-side-effect)&nbsp;&nbsp;
[**`prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp;
[**`fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp;
[**`on`**](#on-evt-fn---events-provider)&nbsp;&nbsp;
[**`attr`**](#attr-name--val-deps---attributes-provider)&nbsp;&nbsp;
[**`cls`**](#class-classes-deps---classes-side-effect)&nbsp;&nbsp;
[**`html`**](#htmlmarkup---html-side-effect)&nbsp;&nbsp;
[**`css`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp;

##

Each function in `spect` creates asynchronous iterator with the following properties:

- `.end()` - tears down stream and all internal streams
- `.then` - makes stream awaitable for the next value
- `<effect>(...args, callback)` - the callback is the last argument for all streams -->
<!-- - returned from callback value is called as destructor of previous value -->
<!-- - `.push(value?)` - puts new data value into stream -->


### `spect( selector | element[s], el => {}? )`

Assign aspect to elements matching selector.

<!--
---

### `prop(target, prop, value => {}? )` − property stream

Emit changed property values.

```js
let target = { foo: null }

let foos = prop(target, 'foo')

for await (const value of foos) {
  console.log(value)
}

foos.cancel()
```

---

### `attr(target, name, value => {}? )` − attribute stream

Observe element attribute, emit changed values.

```js
attr(el, 'hidden', isHidden => {
  console.log(isHidden)
})

// i18n aspect stream
element('.i18n', el => {
  let [lang] = useAttribute(document.documentElement, 'lang')
  let textContent = t(this.str)

  this.str = this.textContent
})
```

---

### `on( element | selector, evt, fn )` − event stream

Observe for element/selector event.

```js
// direct
let off = on(el, 'foo', e => {})

// delegate
on('.target', 'foo', e => {})

// multiple events
on(element, 'connected disconnected', e => {})

// event sequence
for await (const e of on('.target', 'connected disconnected')) {
  // ...
}
```
-->

<!--
---
### ``.html`...markup` `` − patch html

Render html. Uses [`htm`](https://ghub.io/htm) syntax.


```js
// create element
let foo = html`<div#foo/>`

// patch element
html`<${foo}><div.bar/></>`

// component
html`<${Baz} foo=bar/>`
function Baz(props) {
  return html`<div.baz>baz</div>`
}

// render stream into html
html`<.status>${ attr(target, 'status') }</>`
``` -->


<!--
### `css( element, styles )` − CSS side-effect

Provide scoped CSS styles for collection.

```js
// write css
$target.css` :host { width: 100%} `
```
<p align="right">Ref: <a href="https://ghub.io/virtual-css">virtual-css</a></p> -->


<!-- ### `cls( ...classes )` − manipulate classes

Add/remove classes, update dependent aspects.

```js
// write classes
cls(el).foo = true
cls(el, { foo: true, bar: false, bas: isTrue() })
cls(el, clsx => clsx.foo = false)

// read classes
cls(el).foo
cls(el)
``` -->

* `effect` - generic aspect, takes a function and turns it into hookable aspect.
* `element` enables aspect defined on elements, with result, updating the content of some element.
* `action` describes some page/app action, available in the app.
* `store` aspect defines store(model), identifiable by some target or id.
* `event` - describes aspect of interaction, from event source to side-effects.

## Changelog

Version | Changes
---|---
11.0.0 | Aspects-only observer.
10.0.0 | Web-streams.
9.0.0 | Effects as asynchronous iterators.
8.0.0 | Atomize: split core $ to multiple effects.
7.0.0 | Deatomize; single core approach; ref-based approach.
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

<p align="right">HK</p>

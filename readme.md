# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ is [reactive aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web-framework.

#### 🎡 Concept

_Spect_ introduces _reactive functional effects_ with domain accessors to declare dependencies: `$`, `attr`, `html`, `css`, `state`, `data`, `prop`, `on` etc. Less words, more business:

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


```js
import { $, fx, html, attr, local, route } from 'spect'
import ky from 'ky'
import { t, useLocale } from 'ttag'

// main app aspect
use('#app', el => {
  // loading data effect
  fx([route('users/:id')], async (id) => {
    el.setAttribute('loading', true)
    localStorage.setItem('user', await ky.get`./api/user/${ id }`)
    el.setAttribute('loading', false)
  })

  // rendering effect
  fx([local('user'), attr(el, 'loading')], (user, loading) => {
    html`<${el}.preloadable>
      <p.i18n>${ loading ? `Hello, ${ user.name }!` : `Thanks for patience...` }</p>
    </>`
  })
}

// preloadable aspect - shows spinner when `loading` attribute changes
use('.preloadable', el => {
  let progress = html`<progress.progress-circle />`
  let content = [...el.childNodes]
  fx(attr(el, 'loading'), loading => html`<${el}>${ loading ? progress : content }</>`)
})

// i18n aspect - translates content when `lang` attribute changes
use('.i18n', el => {
  let str = text(el)

  fx(defined(attr(el, 'lang'), attr(document.documentElement, 'lang')), lang => {
    useLocale(lang)
    el.textContent = t(str)
  })
})
```

## Installation

**A.** As _npm_ package:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { fx, on } from 'spect'

// ...UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

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
```


## Getting started

🎬 Let's build [basic examples](https://reactjs.org/).

### A Simple Aspect

This example assigns `hello` aspect to `#hello-example` element and renders single `div` with welcoming.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import { html, fx } from 'spect'

// for each #hello-example
use('#hello-example', el => {
  // any time element's `name` property changes
  fx(prop(el, 'name'), name => {
    // render html as
    html`<${el}>
      <div.message>
        Hello, ${ name }!
      </div>
    </>`
  })
})
</script>
```

<p align='right'><a href="https://codesandbox.io/s/a-simple-aspect-xz22f">Open in sandbox</a></p>


### A Stateful Aspect

```js
import { prop, on, fx } from 'spect'

// for every #timer-example element
use('#timer-example'), async el => {
  let state = { seconds: 0 }

  // start timer when connected, end if disconnected
  fx(on(el, 'connected disconnected'), e => {
    let i = setInterval(() => {
      state.seconds++
    }, 1000)
    return () => clearInterval(i)
  })

  // rerender when seconds change
  fx(prop(state, 'seconds'), seconds => html`<${el}>Seconds: ${seconds}</>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


### An Application

```js
import { $, use, on, html, prop } from 'spect'

use('#todos-example', el => {
  let state = { items: [], text: '' }

  // run effect by submit event
  fx(on(el, 'submit'), e => {
    e.preventDefault()

    if (!state.text.length) return

    state.items = [...items, { text: state.text, id: Date.now()}]
    state.text = ''
  })

  // rerender html when state changes
  fx(prop(state, 'items'), (items) => {
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
          Add #${ items.length + 1 }
        </button>
      </form>
    </>`
  })
})

use('#todo-list', el => {
  fx(prop(el, 'items'), items => html`<${el}><ul>${ items.map(item => html`<li>${ item.text }</li>`)}</ul></>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import { html, use } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
use('#markdown-example', el => html`<${el}><${MarkdownEditor} content='Hello, **world**!'/></el>`)
```

```js
// editor.js
import { prop, state, html } from 'spect'
import { Remarkable } from 'remarkable'

function MarkdownEditor(el) {
  let state = { value: el.content }

  fx(prop(state, 'value'), (value) => {
    html`<${el}.markdown-editor>
      <h3>Input</h3>
      <label for="markdown-content">
        Enter some markdown
      </label>
      <textarea#markdown-content
        onchange=${e => state.value = e.target.value )}
      >${ value }</textarea>

      <h3>Output</h3>
      <div.content innerHTML=${ getRawMarkup(value) }/>
    </>`
  })
}

let getRawMarkup = content => {
  const md = new Remarkable();
  return md.render(content);
}
```

<p align='right'><a href="https://codesandbox.io/s/a-component-tnwdm">Open in sandbox</a></p>

<!--
### More examples

* [Popup-info component from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):
-->



## API

#### Readable

[**`prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp;
[**`store`**](#state-name--val-deps---state-provider)&nbsp;&nbsp;
[**`use`**](#use-el--destroy--deps---generic-side-effect)&nbsp;&nbsp;
[**`fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp;
[**`on`**](#on-evt-fn---events-provider)&nbsp;&nbsp;
[**`attr`**](#attr-name--val-deps---attributes-provider)&nbsp;&nbsp;
[**`cls`**](#class-classes-deps---classes-side-effect)&nbsp;&nbsp;

#### Writable

[**`html`**](#htmlmarkup---html-side-effect)&nbsp;&nbsp;
[**`css`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp;
[**`$`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp;

##

<!-- ### `$( selector | els | markup )` − create collection

Create collection of elements, wrapped into [spect](https://ghub.io/spect). Effects broadcast to all items in collection.

```js
// select nodes
$('#id.class > div')
$(elements)
$('> div', container)

// create html
$('<div.foo/>')
$`foo <bar.baz/>`
```

<p align="right">Ref: <a href="https://jquery.com">jquery</a>, etc.</p> -->


### `use( selector | element, el => {} )`

Observes selector in the dom, invokes callback when the element appears.

```js
let unuse = use('.foo', el => {
  // init
})
// destroy
unuse()

// replace element with another element
use('.bar', (el) => document.createElement('baz'))

// awaits element in the DOM
await use('#qux', el => {})
```

### `fx( ...deps, (...deps) => {} )` − reactive effect

Generic reactive effect for any input streams. Takes input asyncIterables, invokes callback whenever any of inputs gets new value.

```js
let state = store({ y : 0})

await use('.foo', el => {
  let disable = fx(() => {
    // rerender after 1s
    let i = setTimeout(() => el.x++, 1000)

    return () => clearTimeout(i)
  })
})

// triggers rerendering of `.foo` fx
state.y = 1
```

### ``.html`...markup` `` − patch html

Render html. Uses [`htm`](https://ghub.io/htm) syntax.


```js
// create element
let foo = html`<div#foo/>`

// render to target
html`<${fooEl}><div.bar/><${baz}/></>`

function baz(props) {
  return html`<div.baz>baz</div>`
}
```


<!-- ### `on( element | selector, evt, fn )` − events provider

Register event listeners for elements / selector.

```js
// direct
let off = on(el, 'foo', e => {})

// delegate
on('.target', 'foo', e => {})

// multiple events
on('.target', 'foo bar', e => {})

// event sequence
on('.target', 'connected > disconnected', e => {
  // connected

  return () => {
    // disconnected
  }
})
``` -->

<!--
### `store( obj )` − provide state

Storage provider. Reading subscribes current effect to changes of that prop, writing triggers subscribed effects.

```js
// create
let s = store({ foo: null })

// read
s.foo

// write
s.foo = 'bar'
``` -->

<!--
### `prop( target, obj | fn ? )` − read / write properties

Read or write target properties. Reading subscribes current effect to changes of that prop, writing triggers subscribed effects.

```js
// get props
let p = prop(target)

// read
p.foo

// write
p.foo = 'bar'

// batch update / reduce
prop(target, { foo: 'bar' })
prop(target, p => p.foo = 1)
prop(target, p => {...p, foo: 1})
```

### `state( target, obj | fn ? )` − read / write state

Read or write state associated with target. Same as `prop`, but provides state, associated with target.

```js
// get state
let s = state(target)

// read
s.foo

// write
s.foo = 'bar'

// update / reduce
state(target, { foo: 'bar' })
state(target, s => s.foo = 1)
state(target, s => {...s, foo: 1})
```


### `attr( element, obj | fn ? )` − read / write attributes

Read or write attributes of an element. Same as `.state` or `.prop`, but works with attributes, therefore values are strings. Reading creates observer for external attribute changes. For boolean values, it sets/unsets attribute, rather than stringifies value.

```js
let a = attr(element)

// get
a.foo

// set
a.foo = 'bar'

// update / reduce
attr(element, { foo: 'bar' })
attr(element, a => a.foo = 1)
attr(element, a => {...a, foo: 1})
```
-->

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

<!-- ### `$( selector, container? )` − select nodes

Simple query selector.

```js
// query single
$('#foo') // fooEl

// query multiple
$('.bar') // [barEl, barEl]
$('baz') // [bazEl, bazEl]

// query within
$('qux', $('#foo')) // [qux]
``` -->


## Changelog

Version | Changes
---|---
8.0.0 | Atomize: split core to multiple effects.
7.0.0 | Deatomize; single core approach; final ref-based approach.
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

##

<p align="center">HK</p>

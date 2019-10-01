# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web-framework.

#### 🎡 Concept

_Spect_ introduces _reactive aspects_ and collection of _side-effects_ to manipulate data domains: `attr`, `html`, `css`, `state`, `data`, `prop`, `on` etc.

#### 🏛️ Principles

1. Expressivity.
2. No bundling.
3. HTML first.
3. Organic hydration.
5. Max utility, min presentation.

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
import { html, attr, state, fx, route } from 'spect'
import ky from 'ky'
import { t, useLocale } from 'ttag'

// main app aspect - load data aspect
use('#app', async (el) => {
  // load data aspect
  fx(() => {
    let { id } = route('users/:id')
    attr(el).loading = true
    state(el).user = await ky.get`./api/user/${ id }`
    attr(el).loading = false
  })

  // render data aspect
  fx(() => {
    let user = state(el).user, loading = attr(el).loading
    html`<${el}.preloadable>
      <p.i18n>${ loading ? `Hello, ${ user.name }!` : `Thanks for patience...` }</p>
    </>`
  })
}

// preloader aspect - append/remove spinner if loading state changes
use('.preloadable', async el => {
  let progress = html`<progress.progress-circle />`
  let content = [...el.childNodes]
  fx((loading) => html`<${el}>${ attr(el).loading ? progress : content }</>`)
})

// i18n aspect - translates content when `lang` attribute changes
use('.i18n', el => {
  let str = text(el)

  fx(() => {
    let lang = attr(el).lang || attr(document.documentElement).lang
    useLocale(lang)
    text(el, t(str))
  })
})
```
-->

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
import { fx, on } from 'https://unpkg.com/spect@latest?module'

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
import { html, $, fx } from 'spect'

use('#hello-example', el => {
  html`<${el}>
    <div.message>
      Hello, ${ prop(el).name }!
    </div>
  </>`
})
</script>
```

<p align='right'><a href="https://codesandbox.io/s/a-simple-aspect-xz22f">Open in sandbox</a></p>


### A Stateful Aspect

_Spect_ introduces `.state`, `.mount`, `.fx` and other effects, similar to `useState` and `useEffect` hooks and jQuery utils. Effects may accept `deps` argument for conditional triggering.

```js
import { state, on, fx } from 'spect'


use('#timer-example', el => {
  let el = e.target
  state(el, { seconds: 0 })

  let i = setInterval( () => state(el).seconds++, 1000 )

  fx(() => {
    html`<${el}>Seconds: ${ state(el).seconds }</>`
    console.log( state(el).seconds )
  })

  return () => clearInterval(i)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


### An Application

Events are provided by `.on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes.

```js
import { $, use, on, delegate, html, state, h } from 'spect'

use('#todos-example', el => {
  let {items = [], text = ''} = state(el)

  on(el, 'submit', e => {
    e.preventDefault()

    if (!text.length) return

    const newItem = {
      text,
      id: Date.now()
    };

    state(el, {
      items: [...state.items, newItem],
      text: ''
    })
  })

  html`<${el}>
    <h3>TODO</h3>
    <main.todo-list items=${ items }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <br/>
      <input#new-todo onchange=${ e => state(el).text = e.target.value } value=${ state(el).text }/>
      <button>
        Add #${ items.length + 1 }
      </button>
    </form>
  </>`
})

use('.todo-list', e => {
  let el = e.target
  fx(() => html`<${el}><ul>${ prop(el).items.map(item => html`<li>${ item.text }</li>`) }</ul></>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import { h, html } from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
on('#markdown-example', 'connected', e => html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

```js
// editor.js
import { prop, state, html } from 'spect'
import { Remarkable } from 'remarkable'

export default function MarkdownEditor (el) {
  state(el).value = el.content

  fx(() => {
    html`<${el}.markdown-editor>
      <h3>Input</h3>
      <label for="markdown-content">
        Enter some markdown
      </label>
      <textarea#markdown-content
        onchange=${ e => state(el).value = e.target.value ) }
      >${ state(el).value }</textarea>

      <h3>Output</h3>
      <div.content innerHTML=${ getRawMarkup( state(el).value ) }/>
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

[**`.use`**](#use-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp; [**`.attr`**](#attr-name--val-deps---attributes-provider)&nbsp;&nbsp; [**`.html`**](#htmlmarkup---html-side-effect)&nbsp;&nbsp; [**`.text`**](#text-content----text-content-side-effect)&nbsp;&nbsp; [**`.clsx`**](#class-classes-deps---classes-side-effect)&nbsp;&nbsp; [**`.css`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp; [**`.on`**](#on-evt-fn---events-provider)&nbsp;&nbsp; [**`.mount`**](#mount-fn-onmount--onunmount----lifecycle-callbacks)

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


### `use( selector | element, el => {} )` − assign aspect to elements

Observe selector in DOM, run init function when element appears in the DOM. Returns thenable abortable handler.

```js
let { abort } = use('.foo', el => {
  // connected
  return () => {
    // disconnected
  }
})
abort()

// awaits the first element in the DOM
await use('#bar', el => {})
```

<!--
### `run( ...fns )` - run aspects

Run aspect functions. Used internally by `use`.

```js
run(() => {
  // ...aspect with subscriptions
})

// async aspects make result async
await run(() => {}, async () => {}, Promise.resolve().then())
``` -->


### `fx( el => {} )` − side-effect

Creates reactive effect function - it is re-run whenever any of internal dependencies change.

```js
let bar = $('.bar')

await use('.foo', el => {
  // subscribe to attribute updates
  fx(() => {
    let x = attr( el ).x
    let y = attr( bar ).y

    // rerender after 1s
    let i = setTimeout(() => attr( el ).x++, 1000)

    return () => clearTimeout(i)
  })
})

// triggers rerendering of `.foo` fx
attr(bar, { y: 1 })
```


### `state( target, obj | fn ? )` − read / write state

Read or write state associated with target. Target can be any object or primitive. Reading subscribes current effect to changes of that state. Writing rerenders all subscribed effects.

```js
// create / get state, associated with target
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

### `prop( target, obj | fn ? )` − read / write properties

Read or write target properties. Same as `.state`, but uses target own properties.

```js
// create / get target props
let p = prop(target)

// read
p.foo

// write
p.foo = 'bar'

// update / reduce
prop(target, { foo: 'bar' })
prop(target, p => p.foo = 1)
prop(target, p => {...p, foo: 1})
```

### `attr( element, obj | fn ? )` − read / write attributes

Read or write attributes of an element. Same as `.state`, but works with attributes, therefore values are strings. Reading creates observer for external attribute changes. For boolean values, it sets/unsets attribute, rather than stringifies value.

```js
let a = attr(element)

a.foo = 'bar'
a.foo

// update / reduce
attr(element, { foo: 'bar' })
attr(element, a => a.foo = 1)
attr(element, a => {...a, foo: 1})
```

### ``.html`...markup` `` − patch html

Render html. Uses [`htm`](https://ghub.io/htm) syntax. Combines vdom with real dom - sync call creates vdom node, that hardens in the next tick, unless replaced with the new vnode.


```js
// create vdom
let foo = html`<div#foo/>`

// vdom → element
let fooEl = await foo

// render to target
html`<${fooEl}><div.bar/><${baz}/></>`

function baz(props) {
  return html`<div.baz>baz</div>`
}
```

### `on( element, evt, fn )` − events provider

Registers event listeners for elements in collection.

```js
// direct
on(el, 'foo', e => {})

// delegate
on('.target', 'foo', e => {})

// multiple events
on('.target', 'foo bar', e => {})
```

<!--
### `text( element, content ) ` − text content side-effect

Provide text content for elements.

```js
// set text
$target.text`...text`
$target.text(str => i18n(nbsp(clean(str))))

// get text
$target.text()
``` -->

<!--
### `css( element, styles )` − CSS side-effect

Provide scoped CSS styles for collection.

```js
// write css
$target.css` :host { width: 100%} `
```
<p align="right">Ref: <a href="https://ghub.io/virtual-css">virtual-css</a></p> -->


### `class( ...classes, deps? )` − manipulate classes

Add/remove classes, update dependent aspects.

```js
// write classes
class(el).foo = true
class(el, { foo: true, bar: false, bas: isTrue() })
class(el, clsx => clsx.foo = false)

// read classes
class(el).foo
class(el)
```




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

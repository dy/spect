# Spect ![experimental](https://img.shields.io/badge/stability-experimental-red) [![Build Status](https://travis-ci.org/dy/spect.svg?branch=master)](https://travis-ci.org/dy/spect)

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework for creating expressive UIs.

```js
import $ from 'spect';
import route from 'spect-router';
import ky from 'ky';
import { t, useLocale } from 'ttag';

// main app aspect - loading & rendering data data
function main (app) {
  let [ match, {id} ] = route`/user/:id`;
  if (!match) return

  let $app = $(app)

  // run state effect when `id` changes (useState + useEffect + idx)
  $app.state(state => {
    state.loading = true;
    state.user = await ky.get`./api/user/${ id }`;
    state.loading = false;
  }, [id]);

  // html side-effect
  $app.html`<p use=${i18n}>${
    $app.state('loading') ? `Hello, ${ $app.state('user.name') }!` : `Thanks for patience...`;
  }</p>`;
}

// preloader aspect - appends spinner when loading state changes
function preloader (el) {
  let $el = $(el)
  $el.fx(() => {
    let orig = $el.html()
    $el.html`${ orig } <canvas.spinner />`
    return () => $el.html`${ orig }`
  }, $el.state('loading'));
}

// i18n aspect - translates content when `lang` attribute changes
function i18n (el) {
  let $el = $(el)
  let lang = $el.attr`lang` ||  $(document.documentElement).attr`lang`
  $el.fx(el => {
    useLocale(lang)
    el.text(text => t(text))
  }, lang)
}

// assign aspects to #app element
$`#app`.use(main, preloader);
```

## Concept

Spect is build with a set of modern practices in mind (proxies, symbols, tagged strings, virtual dom, incremental dom, htm, custom elements, hooks, observers, tuples, frp). It grounds on API design research, experiments and proofs.

#### 🎡 Wheel formula:

> _Spect_ = _$ Collections_ + _Reactive Aspects_ + _Side-Effects_


#### 🏛️ Principles:

1. Expressivity.
2. No bundling.
3. Hydration as part of progressive enhancement.
4. Standard HTML first.
5. Max utility, min presentation.

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

## Installation

**A.** As _npm_ package:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

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

### A Simple Aspect

This example assigns `hello` aspect to `body` and renders single `div` with welcoming.

```js
import $ from 'spect'

$(document.body).use(hello)

function hello (body) {
  $(body).html`<div#hello-example.hello name="Taylor">
    Hello, ${ div => div.name }!
  </div>`
}
```

<p align='right'><a href="">Open in sandbox</a></p>


### A Stateful Aspect

_Spect_ introduces `.state`, `.mount` and `.fx` effects, similar to `useState` and `useEffect` hooks. `state` effect can optionally take `deps` argument, like `fx`.

```js
import $ from 'spect'

$`#timer-example`.use(el => {
  let $el = $(el)

  // init
  $el.state({ seconds: 0 }, [])

  // start timer when connected
  $el.mount(() => {
    let i = setInterval( () => $el.state(s => s.seconds++), 1000 )

    return () => clearInterval(i)
  })

  $el.html`Seconds: ${ $el.state('seconds') }`

  console.log($el.state('seconds'))
})

```

<p align='right'><a href="">Open in sandbox</a></p>


### An Application

Events are provided by `.on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes. Also `.class` and `.css` effects provide nice ways to workaround common tasks.

```js
import $ from 'spect'

$`#todos-example`.use(Todo)

function Todo (el) {
  let $el = $(el)

  $el.state({ items: [], text: '' }, [])

  $el.on('submit', e => {
    e.preventDefault();

    if (!$el.state('text.length')) return;

    const newItem = {
      text: el.state('text'),
      id: Date.now()
    };

    // in-place reducer
    $el.state(({items}) => ({
      items: [...items, newItem],
      text: ''
    }))
  })

  $el.on('change', '#new-todo', e => $el.state({ text: e.target.value });

  $el.html`
    <h3>TODO</h3>
    <main is=${TodoList} items=${ $el.state('items') }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <input#new-todo value=${ $el.state('text') }/>
      <button>
        Add #${ $el.state('items.length') + 1 }
      </button>
    </form>
  `
}

// TodoList component
function TodoList (el) {
  $(el).html`<ul>${ el.items.map(item => $`<li>${ item.text }</li>`) }</ul>`
}
```

<p align='right'><a href="">Open in sandbox</a></p>


### A Component

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import $ from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$`#markdown-example`.use(el => el.html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

```js
// editor.js
import $ from 'spect'
import Remarkable from 'remarkable'

export default function MarkdownEditor (el) {
  let $el = $(el)

  $el.state({ value: $el.prop('content') }, [ $el.prop('content') ])

  $el.class`markdown-editor`

  $el.html`
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content
      onchange=${e => $el.state({ value: e.target.value })}
    >${ $el.state('value') }</textarea>

    <h3>Output</h3>
    <div.content html=${ getRawMarkup( $el.prop('content') ) }/>
  `
}

let getRawMarkup = content => {
  const md = new Remarkable();
  return md.render(content);
}
```

<p align='right'><a href="">Open in sandbox</a></p>

### More examples

* [Details component]()

## API

[**`$`**]()&nbsp; &nbsp;[**`.use`**]()&nbsp; &nbsp;[**`.fx`**]()&nbsp; &nbsp;[**`.state`**]()&nbsp; &nbsp;[**`.prop`**]()&nbsp; &nbsp;[**`.attr`**]()&nbsp; &nbsp;[**`.html`**]()&nbsp; &nbsp;[**`.text`**]()&nbsp; &nbsp;[**`.class`**]()&nbsp; &nbsp;[**`.css`**]()&nbsp; &nbsp;[**`.on`**]()&nbsp; &nbsp;[**`.mount`**]()

##

### `$( selector | els | markup )` − selector / h

Select elements in DOM, provide domain methods for the selected set. The main purpose is shallow reference/wrapper for some nodes collection.
If html string is passed, creates detached DOM. Also acts like hyperscript.

```js
// select nodes
$`#id.class > div`
$(elements)
$`${ element } > div`

// create html
$`<div.a/><div.b/>`
$('div', {}, null)
```

<p align="right">Ref: <a href="https://jquery.com">jquery</a></p>


### `.use( ...fns )` − assign aspects

Assign aspect function(s) to set of elements. Each aspect `fn` is registered for every element in the set. Aspect `fn` is called immediately after assigning, with `el` as argument. By reading state(s) of other elements, aspect subscribes to changes in these states and rerenders itself if changes take place.

```js
let $outer = $`.outer`

$`.selector`.use(el => {
  let $el = $(el)

  // subscribe to attribute updates
  let x = $el.attr`x`
  let y = $outer.attr`y`

  // rerender after 1s
  setTimeout(() => $el.attr( a => a.x++ ), 1000)
})

// trigger xy externally
$outer.attr('y', 1)
```

Aspects can be attached via `.html` effect as well:

```js
$els.html`<div use=${div => {}}></div>`
```

Note that aspects "upgrade" elements - once assigned, elements cannot be "downgraded", very much like custom elements.

<p align="right">Ref: <a href="https://ghub.io/reuse">reuse</a></p>


### `.fx( el => destroy? , deps? )` − generic side-effects provider

Microtask effect function for selected elements (queued immediately after current call stack). Unlike in `useEffect`, `deps` are passed as argument. Additionally, non-array `deps` can be passed to organize primitive FSM.

```js
// called each time
$els.fx(() => {})

// called when value changes to non-false
$els.fx(() => (show(), hide), visible)

// called on init only
$els.fx(() => {}, [])

// destructor
$els.fx(() => destroy, deps)

// called for each element in the set
$els.fx(el => $(el).something)
```

<p align="right">Ref: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `.state( name | val, deps? )` − state provider

Read or write state, associated with an element. Reading returns first element state in the set. Reading subscribes current aspect to changes of that state path. Writing state rerenders all subscribed aspects. Optional `deps` param can organize bypassing, with limitations for hooks (can't be called within conditions).

```js
// write state
$target.state('x', 1)
$target.state({x: 1})
$target.state(_ => _.x.y.z = 1)

// init state
$target.state({x: 0}, [])

// read state
$target.state`x`
$target.state`x.y.z`
$target.state(_ => _.x.y.z)
```

<p align="right">Ref: <a href="https://reactjs.org/docs/hooks-state.html">useState</a>, <a href="https://www.npmjs.com/package/icaro">icaro</a>, <a href="https://www.npmjs.com/package/introspected">introspected</a>, <a href="https://ghub.io/idx">idx</a></p>


### `.prop( name | val, deps? )` − properties provider

Read or write elements properties. Same as `.state`, but provides access to element properties.

```js
// write prop
$target.prop({x: 1})
$target.prop(_ => _.x.y.z = 1) // safe path setter

// read prop
$target.prop`x`
$target.prop(_ => _.x.y.z) // safe path getter
```

<p align="right">Ref: <a href="https://reactjs.org/docs/hooks-state.html">useState</a></p>


### `.attr( name | val, deps? )` − attributes provider

Read or write elements attributes. Same as `.state`, but provides access to attributes. Also, creates observer to trigger rerendering if external attributes change.

```js
// write attribute
$target.attr({ foo: 'bar'})
$target.attr(a => a.foo = 'bar')

// read attribute
$target.attr`foo`
$target.attr()
```

<p align="right">Ref: <a href="https://ghub.io/attributechanged">attributechanged</a></p>


### ``.html( markup ) `` − html side-effect

Render HTML for elements. Internally uses [htm](https://ghub.io/htm) with [incremental-dom](https://ghub.io/incremental-dom).

```js
// set html
$target.html`...markup`

/* @jsx $ */
$target.html(<>Markup</>)

// get html
$target.html()
```

#### Components

`html` effect provides ways to turn tags into custom elements, controlled by aspects.
For that purpose, `is` attribute can be used:

```js
$els.html`<button is=${SuperButton}></button>`
$els.html`<${SuperButton} />`

function SuperButton(button) {
  // ...
}
```

* [Popup-info example from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):

<p align="right">Ref: <a href="https://ghub.io/incremental-dom">incremental-dom</a>, <a href='https://ghub.io/htm'>htm</a></p>


### `.on( evt, fn )` − events provider

Registers event listeners for elements in collection.

```js
// multiple events
$target.on('foo bar', e => {})

// delegate selector
$target.on('foo .delegate', e => {})

// multiple listeners
$target.on({ foo: e => {}, bar: e => {} })

// sequence of events
$target.on('touchstart', e => e => e => {})
```

<p align="right">Ref: <a href="https://github.com/donavon/use-event-listener">use-event-listener</a></p>


### `.mount( fn: onmount => onunmount )` - lifecycle callbacks

Triggers callback `fn` when element is connected to the DOM. Optional returned function is triggered when the element is disconnected.
If an aspect is attached to mounted elements, the `onmount` will be triggered automatically.

```js
$el.mount(() => {
  // connected
  return () => {
    // disconnected
  }
})
```


### ``.text( content ) `` − text content side-effect

Provide text content for elements.

```js
// set text
$target.text`...text`
$target.text(str => i18n(nbsp(clean(str))))

// get text
$target.text()
```


### ``.css( styles, deps? )`` − CSS side-effect

Provide scoped CSS styles for collection.

```js
// write css
$target.css` :host { width: 100%} `
```

<!-- $target.css({ ':host': { width: 100%} }) -->
<!-- $target.css(rules => rules[':host'].width = '100%') -->
<!-- $target.css(':host').width -->
<!-- $target.css.path = obj|str -->
<!-- $target.css.path // obj -->
<!-- $target.css`selector { ...rules }` -->
<!-- $target.css = `selector { ...rules }` -->

<p align="right">Ref: <a href="https://ghub.io/virtual-css">virtual-css</a></p>


### `.class( ...classes, deps? )` − class list side-effect

Manipulate elements classes.

```js
// write classes
$target.class`foo bar baz`
$target.class('foo', true && 'bar', 'baz')
$target.class({ foo: true, bar: false, bas: isTrue() })
$target.class(clsx => clsx.foo = false)

// read classes
$target.class('foo')
$target.class()
```

<p align="right">Ref: <a href="https://ghub.io/clsx">clsx</a>, <a href="https://ghub.io/classnames">classnames</a></p>


### `._update( deps? )` − rerender aspect

Utility method, rerendering all aspects, assigned to elements. Not supposed to be used in normally, because it may break normal state flow and cause unwanted side-effects.

```js
$els = $`.selector`.use(a, b, c)

$els._update()
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


## [FAQ](./faq.md)


## Changelog

Version | Changes
---|---
4.0.0 | Functional effects redesign.
3.0.0 | References approach.
2.1.0 | Reintroduce hoooks.
2.0.0 | Global effects approach.
1.0.0 | HTM compiler refactored.


## Acknowledgement


_Spect_ would not be possible without brilliant ideas from many libraries authors, hence the acknowledge to authors of

_jquery_
_react_
_atomico_,
_hui_
_htm_
_fast-on-load_
_tachyons_
_tailwindcss_
_ui-box_
_evergreen-ui_
material-ui_
_reuse_
_selector-observer_
_material-design-lite_
_funkia/turbine_

and others.

<!-- * _***_ - for letting that be possible. -->


##

<p align="center">HK</p>

<!--
<p align="center">Made on Earth by your humble servant.

<p align="center"><em>Sat, Chit, Ananda, Vigraha.</em><br/><em>Nama, Rupa, Guna, Lila.</em></p> -->

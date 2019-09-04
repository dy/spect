# Spect ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework for creating expressive UIs.

<!--
```js
import $ from 'spect'
import ky from 'ky'
import { t, useLocale } from 'ttag'

// main app aspect - load & render data
function main ({ state, fx, attr, html }) {
  // init state
  state({ id: 1 }, [])

  // run state effect when `id` changes (useState + useEffect)
  fx(() => {
    attr('loading', true)
    state({ user: await ky.get`./api/user/${ state('id') }` })
    attr('loading', false)
  }, [id])

  // html side-effect
  html`<p use=${i18n}>${
    attr('loading') ? `Hello, ${ state('user.name') }!` : `Thanks for patience...`
  }</p>`
}

// preloader aspect - append/remove spinner if loading state changes
function preloader ({ fx, html, attr }) {
  // toggle
  fx(() => {
    html(children => [...children, $`<progress.progress-circle />`])
    return () => html(children => children.slice(0, -1))
  }, attr('loading'))
}

// i18n aspect - translates content when `lang` attribute changes
function i18n ({ attr, fx, text }) {
  let lang = attr('lang') || $(document.documentElement).attr('lang')
  fx(() => {
    useLocale(lang)
    text(text => t(text))
  }, lang)
}

// assign aspects
$('#app').use(main)
$('.preloadable').use(preloader)
```
-->

#### 🎡 Concept

> _Spect_ = _Collections_ + _Reactive Aspects_ + _Side-Effects_

_Spect_ is mixture of jQuery (_collections_), functional react components (_aspects_) and hooks (_side-effects_).

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

**C.** As standalone bundle:

```html
<script src="https://unpkg.com/spect/dist-umd/index.bundled.js"></script>
<script>
  let $ = window.spect

  // ...UI code
</script>
```

## Getting started


🎬 Let's build [basic examples](https://reactjs.org/) with _Spect_.

### A Simple Aspect

This example assigns `hello` aspect to `#hello-example` element and renders single `div` with welcoming.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import $ from 'spect'

function hello({ html, attr }) {
  html`<div.message>
    Hello, ${ attr('name') }!
  </div>`
}

$('#hello-example').use(hello)
</script>
```

<p align='right'><a href="https://codesandbox.io/s/a-simple-aspect-xz22f">Open in sandbox</a></p>


### A Stateful Aspect

_Spect_ introduces `.state`, `.mount`, `.fx` and other effects, similar to `useState` and `useEffect` hooks and jQuery utils. Effects may accept `deps` argument for conditional triggering.

```js
import $ from 'spect'

$('#timer-example').use(({ state, mount, html, state }) => {
  // init
  state({ seconds: 0 }, [])

  // start timer when connected
  mount(() => {
    let i = setInterval( () => state(s => s.seconds++), 1000 )

    // disconnected
    return () => clearInterval(i)
  })

  // html is side-effect, not aspect result
  html`Seconds: ${ state('seconds') }`

  console.log( state('seconds') )
})

```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


### An Application

Events are provided by `.on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes.

```js
import $ from 'spect'

$('#todos-example').use(Todo)

function Todo({ state, on, html }) {
  // init
  state({ items: [], text: '' }, [])

  on('submit', e => {
    e.preventDefault();

    if (!state('text.length')) return;

    const newItem = {
      text: state('text'),
      id: Date.now()
    };

    // in-place reducer
    state(state => ({
      items: [...state.items, newItem],
      text: ''
    }))
  })

  on('change', '#new-todo', e => state({ text: e.target.value }));

  html`
  <h3>TODO</h3>
  <main is=${TodoList} items=${ state('items') }/>
  <form>
    <label for=new-todo>
      What needs to be done?
    </label>
    <br/>
    <input#new-todo value=${ state('text') }/>
    <button>
      Add #${ state('items.length') + 1 }
    </button>
  </form>
`
}

// TodoList component
function TodoList({ html, items }) {
  html`<ul>${ items.map(item => $`<li>${ item.text }</li>`) }</ul>`
}
```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import $ from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$('#markdown-example').use(({ html }) => html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

```js
// editor.js
import $ from 'spect'
import { Remarkable } from 'remarkable'

export default function MarkdownEditor ({ prop, state, class: cls }) {
  state({ value: prop('content') }, [ prop('content') ])

  cls`markdown-editor`

  html`
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content
      onchange=${e => state({ value: e.target.value })}
    >${ state('value') }</textarea>

    <h3>Output</h3>
    <div.content html=${ getRawMarkup( state('value') ) }/>
  `
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

[**`$`**](#-selector--els--markup---selector--h)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp; [**`.attr`**](#attr-name--val-deps---attributes-provider)&nbsp;&nbsp; [**`.html`**](#htmlmarkup---html-side-effect)&nbsp;&nbsp; [**`.text`**](#text-content----text-content-side-effect)&nbsp;&nbsp; [**`.clsx`**](#class-classes-deps---classes-side-effect)&nbsp;&nbsp; [**`.css`**](#css-styles-deps---css-side-effect)&nbsp;&nbsp; [**`.on`**](#on-evt-fn---events-provider)&nbsp;&nbsp; [**`.mount`**](#mount-fn-onmount--onunmount----lifecycle-callbacks)

##

### `$( selector | els | markup )` − selector / h

Select elements in DOM, provide domain methods for the selected set. The main purpose is shallow reference/wrapper for some nodes collection.
If html string is passed, creates detached DOM. Also can acts like hyperscript, if arguments signature matches.

```js
// select nodes
$('#id.class > div')
$(elements)
$('> div', container)

// create html
$('<div.foo/>')
$`foo <bar.baz/>`

// await for planned effects
await $`<a/>`.use(MaterialButton)
```

<p align="right">Ref: <a href="https://jquery.com">jquery</a>, etc.</p>


### `.use( ...fns )` − assign aspects

Assign aspect function(s) to set of elements. Each aspect `fn` is registered for every element in the set. Aspect `fn` is invoked immediately, with `el` as argument. By reading state(s) of other elements, aspect subscribes to changes in these states and rerenders itself if changes take place.

```js
let $foo = $('.foo')
let $bar = $('.bar')

$foo.use($el => {
  // subscribe to updates
  let x = $el.attr('x')
  let y = $bar.attr('y')

  // rerender after 1s
  setTimeout(() => $el.attr( a => a.x++ ), 1000)
})

// triggers rerendering $foo
$bar.attr('y', 1)
```

Aspects can be attached via `.html` effect as well:

```js
$els.html`<div is=${foo} use=${[bar, baz]}></div>`
```

Aspects, assigned via `is`, define custom elements, see `.html` effect for details.
Note that aspects "upgrade" elements - once assigned, elements cannot be "downgraded", very much like custom elements.

<p align="right">Ref: <a href="https://ghub.io/reuse">reuse</a></p>


### `.fx( el => destroy? , deps? )` − generic side-effect

Run effect function for selected elements (queued as microtask, called immediately after current callstack). Very much like `useEffect`, with less limitations. Non-array `deps` can be used to organize toggle / fsm that triggers when value changes to non-false, that is useful for binary states like `visible/hidden`, `disabled/enabled`, `active` etc.

```js
// called each time
$els.fx(() => {});

// called when value changes to non-false
$els.fx(() => { show(); return () => hide(); }, visible);

// called on init only
$els.fx(() => {}, []);

// destructor is called any time deps change
$els.fx(() => () => {}, deps);

// called for each element in collection
$els.fx($el => $el.someEffect);
```

<p align="right">Ref: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `.state( name | val, deps? )` − state provider

Read or write state associated with an element. Reading returns first element state in the set. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define bypassing strategy, see `.fx`.

```js
// write state
$els.state('foo', 1)
$els.state({ foo: 1 })
$els.state('foo.bar.baz', 1) // safe-path set

// mutate/reduce
$els.state(s => s.foo = 1)
$els.state(s => {...s, foo: 1})

// init
$els.state({foo: 1}, [])

// read (first element)
$els.state('foo')
$els.state('foo.bar.baz') // safe-path get

// read full
$els.state()
```

<p align="right">Ref: <a href="https://reactjs.org/docs/hooks-state.html">useState</a>, <a href="https://www.npmjs.com/package/icaro">icaro</a>, <a href="https://www.npmjs.com/package/introspected">introspected</a>, <a href="https://ghub.io/dlv">dlv</a></p>


### `.prop( name | val, deps? )` − properties provider

Read or write elements properties. Same as `.state`, but provides access to element properties.

```js
// write prop
$els.prop('foo', 1)
$els.prop({foo: 1})

// mutate
$els.prop(p => p.foo = 1)

// reduce
$els.prop(p => {...p, foo: 1})

// init
$els.prop({foo: 1}, [])

// read first element prop
$els.prop('foo')

// read all
$els.prop()
```

<p align="right">Ref: <a href="https://reactjs.org/docs/hooks-state.html">useState</a></p>


### `.attr( name | val, deps? )` − attributes provider

Read or write attributes to elements in a set. Same as `.prop`, but works with attributes, therefore values are always strings. Reading creates observer for external attribute changes. For boolean values, it sets/unsets attribute, rather than stringifies value.

```js
// write attribute
$els.attr('foo', 'bar')
$els.attr({ foo: 'bar'})

// mutate
$els.attr(a => a.foo = 'bar')

// reduce
$els.attr(a => {...a, foo: 'bar'})

// read first element attribute
$els.attr('foo')

// read all
$els.attr()

// set/unset attribute
$els.attr('foo', true)
$els.attr('foo', false) // same as null or undefined
```

<p align="right">Ref: <a href="https://ghub.io/attributechanged">attributechanged</a></p>


### ``.html`...markup` `` − html side-effect

Patch HTML for elements in collection. Internally uses [htm](https://ghub.io/htm) and [incremental-dom](https://ghub.io/incremental-dom) for efficient rendering.

```js
// set html
$els.html`foo <bar><baz/></> qux`
$els.html`foo ${ document.querySelector('.bar') } ${ $baz }`
$els.html`<div>${ $div => {} }</div>`
$els.html(document.querySelector('.bar'), deps)
$els.html([foo, bar, baz], deps)

// append/prepend, reduce, wrap/unwrap
$els.html(children => [prepend, ...children, append])
$els.html(children => $`<div.foo>${ children }</div>`)

/* @jsx $.h */
$els.html(<>Markup</>)

// components
$els.html`<button is=${SuperButton}></button>`
$els.html`<${SuperButton}/>`
function SuperButton($btn) {
  // ...
}

// assign aspects
$els.html`<foo use=${bar}/>`
$els.html`<foo use=${[bar, baz]}/>`
```

<p align="right">Ref: <a href="https://ghub.io/incremental-dom">incremental-dom</a>, <a href='https://ghub.io/htm'>htm</a></p>


### `.on( evt, fn )` − events provider

Registers event listeners for elements in collection.

```js
// single event
$target.on('foo', e => {})

// multiple events
$target.on('foo bar', e => {})

// delegate selector
$target.on('foo', '.bar', e => {})

// sequences
$target.on('touchstart > touchmove > touchend', e => {
  // touchstart

  return e =>
    // touchmove

    return e => {
      // touchend
    }
  }
})
```

<p align="right">Ref: <a href="https://github.com/donavon/use-event-listener">use-event-listener</a></p>


### `.mount( fn: onmount => onunmount )` - lifecycle callbacks

Triggers callback `fn` when element is connected to the DOM. Returned function is triggered when the element is disconnected.
If an aspect is assigned to connected elements, the `onmount` is triggered immediately.

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


### `.class( ...classes, deps? )` − classes side-effect

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


### `.update( deps? )` − rerender aspect

Utility method, rerendering all element aspects. Not for regular use, it can trigger redundant rerenders and cause unwanted side-effects.

```js
$els = $('.selector').use(a, b, c)

$els.update()
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
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.0 | [jsxify](https://github.com/scrapjs/jsxify) JSX R&D


## Acknowledgement


_Spect_ would not be possible without brilliant ideas from many libraries, hence the acknowledge to authors of:

_jquery_,
_react_,
_atomico_,
_hui_,
_htm_,
_fast-on-load_,
_tachyons_,
_tailwindcss_,
_ui-box_,
_evergreen-ui_,
_material-ui_,
_reuse_,
_selector-observer_,
_material-design-lite_,
_funkia/turbine_

and others.

<!-- * _***_ - for letting that be possible. -->


##

<p align="center">HK</p>

<!--
<p align="center">Made on Earth by your humble servant.

<p align="center"><em>Sat, Chit, Ananda, Vigraha.</em><br/><em>Nama, Rupa, Guna, Lila.</em></p> -->

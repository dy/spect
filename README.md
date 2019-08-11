# Spect

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) _reactive_ framework with _effects_ for creating expressive UIs.


```js
import $ from 'spect';
import { route } from 'spect-router';
import { t, useLocale } from 'ttag';
import ky from 'ky';

// main aspect
function app ($app) {
  let [ match, { id } ] = route('user/:id');
  if (!match) return;

  $app.fx(async () => {
    $app.state.loading = true;
    $app.state.user = await ky.get(`./api/user/${id}`);
    $app.state.loading = false;
  }, id);

  $app.html`<p use=${i18n}>${
    $app.state.loading ? `Hello, ${ $app.state.user.name }!` : `Thanks for patience...`;
  }</p>`;
}

// preloader aspect
function preloader ($el) {
  if ($el.state.loading) $el.html`${el.html} <canvas class="spinner" />`;
}

// i18n aspect
function i18n ($el) {
  useLocale($el.attr.lang || $(document.documentElement).attr.lang);
  $el.text = t`${ $el.text }`;
}

// attach aspects to DOM
$('#app').use(app, preloader);
```

## Principles

> 1. Expressive. <!-- not impressive, obvoius code -->
> 2. No bundling. <!-- required -->
> 3. JS-less hydration.
> 4. Standard HTML first.
> 5. Max utility. <!-- min presentation, min proving. -->

## Philosophy

_Spect_ can remotely remind _jQuery_ charged with _React_ hooks. Its API is based on a set of modern practices (Proxies, incremental-dom, hooks), design research, experiments and proves. The current design is third iteration.

### :ferris_wheel: Reinventing the wheel

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

// ...your UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import $ from 'https://unpkg.com/spect@latest?module'

// ...your UI code
</script>
```


## 🎬 Getting started


Let's build [basic examples](https://reactjs.org/) with _Spect_.

### A simple aspect

This example creates _html_ in body and assigns single aspect to it.

```js
import { $ } from 'spect'

$(document.body).html`<div id="hello-example" class="hello" name="Taylor" use=${hello}/>`

function hello ($el) { $el.html`Hello, ${$el.attr.name}!` }
```


## API

Each effect reflects domain it provides shortcut to.

<!-- mount is a hook on html domain -->

[`$`]()  [`.use`]()  [`.state`]()  [`.html`]()  [`.fx`]()  [`.text`]()  [`.class`]()  [`.attr`]()  [`.on`]()  [`.css`]()

##
##

### `$( selector | els )` − elements selector

Select group of elements, provide domain methods for it. The main purpose is to have a shallow reference/wrapper for some node list.

```js
$('#id.class > div')
$(document)
$(element)
$(elements)
$(fn)
```

Related packages: jquery.

### `.use( ...fns )` − aspects provider

Attach aspects to targets. Each aspect will be called for each element in selected group, receiving it as single argument.
`order` can optionally indicate the priority of aspects, the order in which they should follow each other.

```js
$els.use($el => {
  // subscribe via mutation observer
  $el.attr.x

  // subscribe via fast-on-load
  $el.on('connected', e => () => {})
})
```

Aspects can be attached via `.html` effect as well:

```js
$els.html`<div use=${$div => {}}></div>`
```

Related packages: reuse.


### `.fx( fn, ...deps? )` − side-effects provider

Register effect for group of elements. The effect is called in the next tick if deps are changed.

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

Related: useEffect.


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

Related: useState.


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

Related: incremental-dom, htm.

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

Related: hui.


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

Related: virtual-css.


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

Related: classes.


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

Related: [use-event-listener](https://github.com/donavon/use-event-listener)


## Plugins

* [spect-route]() - provide global navigation effect.
* [spect-request]() - request provider.
* [spect-observe]() - selector observer.


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


## Acknowledgement

* _jquery_ - for classic school of API design.
* _react_ - for JSX, hocs, hooks and pains.
* _atomico, hui_ - for novative approach to web-components.
* _htm_ - for mainstream alternative.
* _fast-on-load_ - for fast mutation observer solution.
* _tachyons, tailwindcss, ui-box_ - for CSS use-cases.
* _evergreen-ui, material-ui_ - for practical components examples.
* _reuse_ - for react aspects insight.
* _selector-observer_ - for selector observer example.
* _material-design-lite_ - for upgrading code example and components library.
* _funkia/turbine_ - for generators and examples.
<!-- * _***_ - for letting that be possible. -->

##

<p align="right">HK</p>

<!--
<p align="center">Made on Earth by your humble servant.

<p align="center"><em>Sat, Chit, Ananda, Vigraha.</em><br/><em>Nama, Rupa, Guna, Lila.</em></p> -->

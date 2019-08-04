# Spect

_Spect_ is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework for creating expressive UIs.


```js
import { $, state, html } from 'spect'
import { route } from 'spect-router'
import { t, useLocale } from 'ttag'
import ky from 'ky'

// main aspect
function app ($app) {
  let [ match, { id } ] = route('user/:id')
  if (!match) return

  $app.fx(async () => {
    $app.state.loading = true
    state.user = await ky.get(`./api/user/${id}`)
    $app.state.loading = false
  }, id)

  $app.html = html`<div fx=${i18n}>${
    $app.state.loading ? `Hello, ${ state.user.name }!` : `Thanks for patience...`
  }</div>`
}

// preloader aspect
function preloader ($el) {
  $el.html`${el.html.original} ${ $el.state.loading && html`<canvas class="spinner" />` }`
}

// i18n aspect
function i18n ($el) {
  // retriggered whenever $el.attr.lang, html.lang or el.text change
  useLocale($el.attr.lang || $(document.documentElement).attr.lang)
  $el.text = t`${ $el.text }`
}

// attach aspects to DOM
$('#app').fx(app, preloader)
```

## Principles

> 1. Expressive. <!-- not impressive, obvoius code -->
> 2. No bundling. <!-- required -->
> 3. JS-less hydrate.
> 4. Standard HTML first.
> 5. Max utility. <!-- min presentation, min proving. -->
> 6. Reactive.

## Philosophy

_Spect_ can remotely remind _jQuery_, supercharded with _React_ hooks, but not exactly so. Its API is based on a set of modern practices (Proxies, incremental dom, hooks), design research and experiments. The current API is third iteration.

### :ferris_wheel: Reinventing the wheel

Conceptually, app is a set of _reactions_ to _changes_ in _state_.

_Reaction_ may have various side-_effects_, like changing html, css, page title, sound volume, displaying dialog etc. _React_ components have html-only side-effect of a single container, to provide other side-effects, the mechanism of hooks introduced. In _jQuery_, any element may have an effect on any other element, but lack of component composition is 🍝.

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


## Install

**A.** As _npm_ package:

[![npm install spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import $, { html, state } from 'spect'

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

This example provides _html_ in body and assigns aspect to it.

```js
import { $ } from 'spect'

$(document.body).html`<div id="hello-example" class="hello" name="Taylor" fx=${hello}/>`

function hello ($el) { $el.html`Hello, ${$el.attr.name}!` }
```


## API

Each effect reflects domain it provides shortcut to.

<!-- mount is a hook on html domain -->

[`$`]() · [`.fx`]() · [`.state`]() · [`.html`]() · [`.text`]() · [`.class`]() · [`.attr`]() · [`.on`]() · [`.css`]() · [`.query`]() · [`.route`]()

<!-- `call` -->
<!-- `update` -->
<!-- `destroy` -->
<!-- `watch()` -->
<!-- `cls()` -->

##

### `$`

Select group of elements, very much like jQuery.

```js
// TODO
```

### `.fx` - aspect provider

Register aspect function for group of elements.

```js
// TODO
```

### `.state` - data provider

Read or write state, associated with an element. Read returns state of the first item in the set. Reading state subscribes current aspect to rerender whenever that state changes.

```js
$(target).fx(function fn ($el) {
  $els.state.x = 1
  $els.state.x // 1

  // whenever $a.state.x is set, the fn reruns
  $a.state.x
})
```

### `.html` - DOM provider

Provide HTML content for group of elements.

## FAQ

### Portals?

```js
$(portal).html`Portal content`
```

### JSX?

```js
/* @jsx $.h */
$el.html(
  <div>Inner content</div>
)
```

### Wrap content?

```js
$el.html`Wrap outer <div>${ $el }</div>` // $el contains different nodes list!
$el.html`Wrap inner <div>${ $el.children }</div>` // $el is the same
```


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

# Spect

_Spect_ is framework for creating expressive UIs.


```js
import { $, route, state, html } from 'spect'
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
  $el.html`${el.html.orig} ${ $el.state.loading && html`<canvas class="spinner" />` }`
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

### Requirements

> 1. Expressive. <!-- not impressive, obvoius code -->
> 2. No bundling. <!-- required -->
> 3. JS-less hydrate.
> 4. Standard HTML first.
> 5. Max utility. <!-- min presentation, min proving. -->
> 6. Reactivity.


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

## Getting started

_Spect_ can remotely remind _jQuery_, supercharded with _React_ hooks, but not exactly so. Its API is based on a set of modern practices (Proxies, incremental dom, hooks), design research and experiments. The current API is the third iteration.

### :ferris_wheel: Reinventing the wheel.

_React_ is conceptually a set of _reactions_ with effects_ to _changes_ in _state_.

In general, a _reaction_ may have various side-effects, like changing some _html_, _css_, document title, turning off sound, displaying dialog etc. In React components are tied to html side-effect, serving to component container. But in general that's not the case, and jQuery demonstrates that - any element may have an effect on any other element 🍝. To overcome such limitation, React introduces hooks - a graceful solution to provide side-effects, compared to heap of HOCs, contexts and lifecycle events.

_State_ can be any data structure, related to some domain. In web, main domains are data tree (storage) and DOM tree <small>(ignore history, location, web-audio, localstorage, webgl etc. for now)</small>. In essence, reactions can be triggered by changes in these domains. There are many frameworks, serving well that purpose, like _defi_, _icaro_ etc.

Other approaches include:

* HTML is decomposition of reality, aspects (CSS is aspect).
* streamlined html (fragment is container, attributes reflect domains, tagname is main domain indicator, children are implicit prop of syntax).
* streamlined effects (global is effect holder, effect scope is indicated in ref, effect corresponds to domain).
* streamlined subscription (autosubscribe to domain by reading it, sources of rerendering(target, subscriptions, direct gate call), soft/hard effects).
* optimization API equation (contextual effects → effect constructors → hooks namespace → html wrappers → events middleware).
* streamlined updates (batch updates after fx tick, clean up required diffs).
* streamlized html (orig holder, vdom, )

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

[`.$`]() · [`.fx`]() · [`.state`]() · [`.html`]() · [`.text`]() · [`.class`]() · [`.attr`]() · [`.on`]() · [`.css`]() · [`.query`]() · [`.route`]()

<!-- `call` -->
<!-- `update` -->
<!-- `destroy` -->
<!-- `watch()` -->
<!-- `cls()` -->

##


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

# Spect

_Spect_ is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework for creating expressive UIs.


```js
import $ from 'spect'
import { t, useLocale } from 'ttag'
import ky from 'ky'

// main aspect
function app ($app) {
  let [ match, { id } ] = $app.route('user/:id')
  if (!match) return

  $app.fx(async () => {
    $app.loading = true
    $app.user = await ky.get(`./api/user/${id}`)
    $app.loading = false
  }, id)

  $app.html`<div fx=${i18n}>${
    $app.loading ? `Hello, ${ $app.user.name }!` : `Thanks for patience...`
  }</div>`
}

// preloader aspect
function preloader ($el) {
  if ($el.loading) $el.html`${ $el.children } <canvas class="spinner" />`
}

// i18n aspect
function i18n ($el) {
  useLocale($el.attr.lang || $(document.documentElement).attr.lang)
  $el.html`${ t`${ $el.text }` }`
}

// attach aspects to DOM
$('#app').fx([app, preloader])
```

### Principles

> 1. Expressive. <!-- not impressive, obvoius code -->
> 2. No bundling. <!-- required -->
> 3. JS-less hydrate.
> 4. Standard HTML first.
> 5. Max utility. <!-- min presentation, min proving. -->


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

[Basic examples](https://reactjs.org/).

### A simple aspect

This example provides _html_ in body and assigns aspect to it.

```js
import $ from 'spect'

$(document.body).html`<div id="hello-example" class="hello" name="Taylor" fx=${hello}/>`

function hello ($el) { $el.html`Hello, ${$el.attr.name}!` }
```


## API

[`$`]() · [`fx`]() · [`mount`]() · [`html`]() · [`on`]() · [`css`]() · [`query`]() · [`route`]()

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

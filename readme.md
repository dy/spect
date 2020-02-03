<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<h1 align="center">
  spect
</h1>
<p align="center">
  <img src="https://img.shields.io/badge/stability-experimental-yellow"/>
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
</p>

<img src="/timer.svg" width="640"/>

_Spect_ is a tool for organizing web-apps in [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) fashion. It defines a set of rules for web-page, similar to CSS, where for every rule there is corresponding _aspect_ function.

## Installation

#### From npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

#### Or as ES module:

```html
<script type="module">
import spect from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```

## Usage

Let's build simple timer example.

```js
import spect from 'spect'
import { render, html } from 'lit-html'

spect('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    render(html`Seconds: ${count++}`, el)
  }, 1000)
  return () => clearInterval(id)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>

## API

### unspect = spect( selector | target, callback, context?)

Assigns a `callback` function to `selector` or direct element. Returned `unspect` function removes assigned `callback`. The return of `callback` is destructor callback, called when element is unmounted.

* `selector` must be valid CSS selector.
* `target` can be _dict_ of selectors, an _element_ or _elements list_.
* `callback` is a function `target => ondestroy` or an array of functions.
* `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the worst case mutation observer contributes ≤ 5% to app slowdown.

## See also

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

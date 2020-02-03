# spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ is a tiny tool for organizing web-apps in [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) fashion. It defines a set of rules for web-page, similar to CSS, where for every rule there is corresponding _aspect_.


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

### unspect = spect( target, callback )

Assigns a `callback` function to selector or direct element. Returned `unspect` function removes assigned `callback`. The return of `callback` is destructor callback, called when element is unmounted.

* `target` can be _selector_, _dict_, _element_ or _list_.
* `callback` is a function `target => onDestroy` or an array of functions.


## See also

* [selector-observer](https://ghub.io/selector-observer) − same idea with different API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

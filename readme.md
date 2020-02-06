<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Micro DOM <a href="https://en.wikipedia.org/wiki/Aspect-oriented_programming"><em>aspects</em></a>.<br/>
  Build reactive UI with rules, similar to CSS.<br/>
  Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/stability-experimental-yellow"/>
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <img src="https://img.shields.io/badge/size-%E2%89%A4%E2%80%892.1kb-brightgreen"/>
</p>

<p align="center"><img src="/timer.svg" width="435"/></p>

## Installation

#### From npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

#### As ES module:

```html
<script type="module">
import spect from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```

## Usage

_Spect_ makes no guess at store provider, actions, renderer or tooling setup, that by can be used with different flavors, from vanilla to sugared frameworks.

#### Vanilla

```js
import { $ } from 'spect'

$('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    el.innerHTML = `Seconds: ${count++}`
  }, 1000)
  return () => clearInterval(id)
})
```

<p><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>

<!--

#### React-less hooks

```js
import $ from 'spect'
import * as augmentor from 'augmentor'
import hooked from 'enhook'
import setHooks, { useState, useEffect } from 'unihooks'

// init hooks
enhook.use(augmentor)
setHooks(augmentor)

$('#timer', hooked(el => {
  let [count, setCount] = useState(0)
  useEffect(() => {
    let interval = setInterval(() => setCount(count => count + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  el.textContent = `Seconds: ${count}`
}))
```

#### Microfrontends

Pending...

#### Aspect-Oriented DOM

Pending...

-->

## API

<details><summary><strong><code>$</code></strong></summary>

#### `$( selector | target, callback, context?)`

Assigns a `callback` function to `selector` or direct element. Returned `unspect` function removes assigned `callback`. The return of `callback` is destructor callback, called when element is unmounted.

* `selector` must be valid CSS selector.
* `target` can be _dict_ of selectors, an _element_ or _elements list_.
* `callback` is a function `target => ondestroy` or an array of functions.
* `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the worst case mutation observer contributes ≤ 5% to app slowdown.

</details>

<details><summary><strong><code>state</code></strong></summary>

#### `value = state( init? )`

Create observable value. Returned `ref` is a getter/setter function with _asyncIterator_ interface for observing changes.

```js
let count = state(0)

// get current value
count.current
count()
+count
count.valueOf()
count.toString()

// set value
count.current = 1
count(1)
count(c => c + 1)

// observe changes
for await (let value of count) {
  // 1, ...
}
```

Combines _useRef_ and _useState_ hooks logic, with regards to [observable](https://ghub.io/observable) / [observ](https://ghub.io/observ) / [mutant](https://ghub.io/mutant) and _Observable_ proposal. See design argumentation <a href="https://github.com/spectjs/spect/issues/142">#142</a>.

</details>


<details><summary><strong><code>fx</code></strong></summary>

#### `fx( callback, deps = [] )`

Run callback whenever `deps` change. `deps` is a list of _async iterators_ or _Promises_.
Initial run is triggered with initial deps state.

```js
let count = state(0)
let loading = attr(el, 'loading')

fx((deps) => {
  let [count, loading, data] = deps
  // count === 0
  // loading === el.attributes.loading.value
  // data === el.data

  el.innerHTML = loading ? `Loading...` : `Seconds: ${ count }`
}, [count, loading])

// trigger fx each second
setInterval(() => count(c => c + 1), 1000)

// trigger fx via element attribute
button.onclick = e => el.setAttribute('loading', true)
```

Provides _useEffect_ logic with `deps` as observables or promises instead of direct values.

</details>


## Related

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

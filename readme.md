<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Micro <a href="https://en.wikipedia.org/wiki/Aspect-oriented_programming"><em>aspects</em></a> to rule your DOM.<br/>
  Build reactive UIs with aspect rules, similar to CSS.<br/>
  Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/>
</p>
<p align="center">
  <img src="https://img.shields.io/badge/stability-experimental-yellow"/>
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <img src="https://img.shields.io/badge/size-%E2%89%A4%E2%80%892.1kb-brightgreen"/>
</p>

<p align="center"><img src="/timer.png" width="435"/></p>

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

### _$_ − selector effect

> $( selector | target, aspect, context?)

Assigns a `aspect` function to `selector` or `target` element. The return result of `aspect` is destructor, called when element is unmounted.

* `selector` must be valid CSS selector.
* `target` can be _dict_ of selectors, an _element_ or _elements list_.
* `callback` is a function `target => ondestroy` or an array of functions.
* `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the worst case mutation observer contributes ≤ 5% to app slowdown.

<br/>

### _fx_ − deps effect

> fx( callback, deps = [] )

Run callback on any `deps` change. `deps` is a list of _async iterators_ or _promises_.
First callback is triggered immediately with initial `deps` state.

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

Provides _useEffect_ logic with _deps_ as _iterables_ / _promises_ instead of direct values.

<br/>

### _state_ − observable value

> value = state( init? )

Create observable value. Returned `value` is getter/setter function with _asyncIterator_ interface for subscribing to changes.

```js
let count = state(0)

// get the value
count()

// set the value
count(1)

// observe changes as async iterable
for await (let value of count) {
  // 0, 1, ...
}
```

_fx_ is modern version of [observable](https://ghub.io/observable), incorporates _useRef_ and _useState_ logic. See <a href="https://github.com/spectjs/spect/issues/142">#142</a>.

<br/>

### _compute_ − computed value

> value = computed( fn, deps = [] )

Creates an observable value, computed from `deps`.

### _store_ − observable object

<br/>

### _prop_ − observable property

<br/>

### _attr_ − observable attribute

<br/>

### _on_ − events stream

<br/>

<!-- Best of React, jQuery and RxJS worlds in tiny tool. -->

## Related

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

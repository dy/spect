<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Micro <a href="https://en.wikipedia.org/wiki/Aspect-oriented_programming"><em>aspects</em></a> with <em>effects</em> and <em>observables</em> for building expressive UIs.<br/>
  <!-- Build reactive UIs with rules, similar to CSS.<br/> -->
  <!-- Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/> -->
</p>
<p align="center">
  <img src="https://img.shields.io/badge/stability-experimental-yellow"/>
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <img src="https://img.shields.io/badge/size-%E2%89%A4%E2%80%892.1kb-brightgreen"/>
</p>

<p align="center"><img src="/timer.png" width="435"/></p>

## Usage

#### A. Directly as module:

```html
<script type="module">
import { $, fx } from 'https://unpkg.com/spect@latest?module'

// ...code
</script>
```

#### B. As dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

_Spect_ plays perfectly with [Snowpack](https://www.snowpack.dev/), but any other bundler can be used as well.

<!--
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
-->

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

### _`$`_ − aspect

> $( selector | element, aspect, context? )

Assigns an `aspect` function to `selector` or `element` node. Returned from `aspect `result is destructor, called when element is unmounted.

* `selector` should be a valid CSS selector.
* `element` can be an _element_ or _elements list_.
* `callback` is a function with `target => onDestroy` signature or an array of functions.
* `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the effect of MO is insignificant.

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

<br/>

### _`fx`_ − effect

> fx( callback, deps = [] )

_`fx`_ runs `callback` when the `deps` change. First callback is triggered immediately as microtask with the initial state.

* `deps` should be a list of either _async iterables_ (`Symbol.asyncIterator` method), _observables_ (`.subscribe` method), _promises_ (`.then` method) or direct values.

```js
const likes = fetch(url).then(response => {
  loading(false)
  return response.json()
})
const loading = state(true)

fx(([data, loading]) => {
  el.innerHTML = loading ? `Loading...` : `Likes: ${ likes }`
}, [data, loading])
```

_`fx`_ incorporates _`useEffect`_ logic in FRP world.

<br/>

### _`state`_ − value observable

> value = state( init? )

_`state`_ creates observable value. Returned `value` is getter/setter function with _asyncIterator_ interface for subscribing to changes.

```js
let count = state(0)

// get the value
count()

// set the value
count(1)
count(c => c + 1)

// observe changes
for await (let value of count) {
  // 0, 1, ...
}
```

_`state`_ is modern version of [observable](https://ghub.io/observable), incorporates _useState_ hook logic.

<sub>See <a href="https://github.com/spectjs/spect/issues/142">#142</a> for design argumentation.</sub>

<br/>

### _`compute`_ − computed value

> value = computed( fn, deps = [] )

Creates an observable value, computed from `deps`.

<br/>

### _`prop`_ − property observable

> value = prop( target, name )

_Prop_ is observable for property. Same as _state_, but the value is accessed as object property. _Prop_ keeps initial properties descriptor, so if target has defined setter/getter, they're kept safe.

```js
import { prop, fx } from 'spect'

let o = { foo: 'bar' }

fx(([foo]) => console.log(foo), [prop(o, 'foo')])

o.foo = 'baz'
```

That outputs:
```
"bar"
"baz"
```

Useful to organize props for DOM elements, along with _attr_ effect.

<br/>

### _`attr`_ − attribute observable

<br/>

### _`store`_ − object observable

<br/>

### _`on`_ − event observable

<br/>

### _`ref`_ − value reference

> value = ref( init? )

_`ref`_ is the foundation for _`state`_ and other observables, except for it does not support functional setter and it emits updates on every value set.

```js
let count = ref(0)

// get
count()

// set
count(1)

// sets value to function (!)
count(c => c + 1)
count() // c => c + 1
```

_`ref`_ is direct analog of _useRef_ hook in async iterables world.

<br/>


<!-- Best of React, jQuery and RxJS worlds in tiny tool. -->

## Related

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

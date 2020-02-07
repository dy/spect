<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Micro <a href="https://en.wikipedia.org/wiki/Aspect-oriented_programming"><em>aspects</em></a> with <em>effects</em> and <em>observables</em>.<br/>
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

> $( selector | element, aspect )

Assigns an `aspect` function to `selector` or `element`. Returned from `aspect` result is destructor, called when element is unmounted.

* `selector` should be a valid CSS selector.
* `element` can be an _HTMLElement_ or list of elements (any array-like).
* `aspect` is a function with `target => onDestroy` signature. or an array of functions.

<!-- * `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the effect of MO is insignificant. -->

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

### _`state`_ − observable value

> value = state( init? )

_**`state`**_ creates observable value container. Returned `value` is simply getter/setter function with _asyncIterator_ interface for subscriptions.
_**`state`**_ is like modern [observable](https://ghub.io/observable), or _useState_ unhooked.

```js
let count = state(0)

// get
count()

// set
count(1)
count(c => c + 1)

// observe changes
for await (let value of count) {
  // 0, 1, ...
}
```

<!--<sup>See <a href="https://github.com/spectjs/spect/issues/142">#142</a> for design argumentation.</sup>-->

<br/>

### _`fx`_ − effect

> fx( callback, deps = [] )

_**`fx`**_ reacts on changed `deps` and runs `callback`, very much like _useEffect_.
`deps` expect:

* _Async Generator_ / _Async Iterable_ (an object with `Symbol.asyncIterator` method);
* _Promise_ / _Thenable_ (an object with `.then` method);
* _Observable_ (an object with `.subscribe` method) − [rxjs](https://ghub.io/rxjs), [any-observable](https://ghub.io/any-observable), [zen-observable](https://ghub.io/zen-observable) etc;
* _Function_ − considered an [observable](https://ghub.io) / [observ](https://ghub.io) / [mutant](https://ghub.io/mutant);
* any other value used as constant.

Deps values are passed to `callback` as arguments. Returned from `callback` function is used as destructor.

```js
import { state, fx } from 'spect'
import { time } from 'wait-please'

let count = state(0)

fx(async c => {
  console.log('Seconds', c)
  await time(1000)
  count(c + 1)
}, [count])
```

<br/>


### _calc`__ − computed value

> value = calc( fn, deps = [] )

Creates an observable value, computed from `deps`. Direct analog of _`useMemo`_ hook.

<br/>

### _`prop`_ − property observable

> value = prop( target, name )

_`prop`_ has the same logic as _state_, but the value is accessed as `target` property. _`prop`_ keeps defined properties, so that the target's setter/getter are kept safe.

```js
import { prop, fx } from 'spect'

let o = { foo: 'bar' }

fx(([foo]) => console.log(foo), [prop(o, 'foo')])

o.foo = 'baz'

// outputs
// "bar"
// "baz"
```

<br/>

### _`attr`_ − attribute observable

> value = attr( element, name )

<br/>

### _`store`_ − object observable

> obj = store( init = {} )

<br/>

### _`on`_ − event observable

> evts = on( element, eventName )

<br/>

### _`ref`_ − core observable

> value = ref( init? )

_`ref`_ is the foundation for _`state`_ and other observables, except for it does not support functional setter and it emits updates on every value set.  _`ref`_ is direct analog of _useRef_ hook in FRP world.

```js
let count = ref(0)

// get
count()

// set
count(1)

// sets value to a function (!)
count(c => c + 1)
count() // c => c + 1
```

<br/>


<!-- Best of React, jQuery and RxJS worlds in tiny tool. -->

## Related

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

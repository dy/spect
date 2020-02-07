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

### _`$`_ − DOM aspect

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

_**`state`**_ creates observable value container. Returned `value` is simply getter/setter function with _asyncIterator_ interface for subscriptions. `init` can be an initial value or initializer function.
_**`state`**_ is like modern [observable](https://ghub.io/observable), or _useState_ unhooked.

```js
import { state } from 'spect'

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

* _Async Generator_ / _Async Iterable_ (an object with [`Symbol.asyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) method);
* _Promise_ / _Thenable_ (an object with `.then` method);
* _Observable_ (an object with `.subscribe` method) − [rxjs](https://ghub.io/rxjs) / [any-observable](https://ghub.io/any-observable) / [zen-observable](https://ghub.io/zen-observable) etc;
* _Function_ is considered an [observable](https://ghub.io) / [observ](https://ghub.io) / [mutant](https://ghub.io/mutant);
* any other value is considered constant.

`deps` values are passed to `callback` as arguments. Returned from `callback` function is used as destructor.

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


### _`calc`_ − computed value

> value = calc( fn, deps = [] )

Creates an observable value, computed from `deps`. Direct async analog of _useMemo_ hook. Has the same API as _**`fx`**_, but returned result is observable `value`, instead of destructor.

```js
import { $, input, calc } from 'spect'

const f = state(32), c = state(0)
const celsius = calc(f => (f - 32) / 1.8, [f])
const fahren = calc(c => (c * 9) / 5 + 32, [c])

celsius() // 0
fahren() // 32
```

<br/>

### _`prop`_ − property observable

> value = prop( target, name )

_**`prop`**_ has the same logic as _**`state`**_, but the value is accessed as `target` property. _**`prop`**_ handles properly target getter/setter, if property has custom descriptor.

```js
import { prop, fx } from 'spect'

let o = { foo: 'bar' }

fx(foo => console.log(foo), [prop(o, 'foo')])

o.foo = 'baz'

// outputs
// "bar"
// "baz"
```

<br/>

### _`attr`_ − attribute observable

> value = attr( element, name )

Like _**`prop`**_, can provide access to element attribute. Notifies whenever attribute value changes.

```js
import { fx, attr } from 'spect'

fx(loading => {
  console.log(loading)
}, [attr(el, 'loading')])
```

<br/>

### _`store`_ − store provider

> obj = store( init = {} )

Observable object. Unlike _**`state`**_, returns direct oobject (implemented as _Proxy_), than can be used as a dependency for _**`fx`**_ or changed directly. Similar to _Struct_ in [mutant](https://ghub.io/mutant) (if that's of any help).

```js
import { store } from 'spect'

let likes = store({
  count: null,
  loading: false,
  load() {
    this.loading = true
    let response = await fetch(url)
    let data = await response.json()
    this.loading = false
    this.count = data.count
  }
})

$('.likes-count', el => {
  fx(async () => {
    render(likes.loading ? html`Loading...` : html`Likes: ${ likes.count }`, element)
  }, [likes])
})
```

<br/>

### _`on`_ − event observable

> evts = on( element, eventName )

Stateless events stream. Useful for organizing event-based observables, such as _**`hover`**_, _**`focus`**_, _**`input`**_ etc.

```js
import { $, on, calc, fx } from 'spect'

$('input', el => {
  // current input value
  let value = calc(e => e.target.value, [
    on(el, 'input'),
    on(el, 'change')
  ])

  // current focus state
  let focus = calc(e => e.type === 'focus', [
    on(el, 'focus'),
    on(el, 'blur')
  ])

  // for example...
  fx(validate, [ value ])
})
```

<br/>

### _`ref`_ − raw value observer

> value = ref( init? )

_**`ref`**_ is the foundation for _`state`_ and other observables. Is simply stores value − does not support functional setter and notifies about every set call.  _**`ref`**_ is direct analog of _useRef_ hook.

```js
import { ref } from 'spect'

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

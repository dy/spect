<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Micro DOM <em>aspects</em> with <em>effects</em> and <em>observables</em>.<br/>
  <!-- Build reactive UIs with rules, similar to CSS.<br/> -->
  <!-- Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/> -->
</p>
<p align="center">
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a>
  <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>
  <img src="https://img.shields.io/badge/stability-unstable-yellowgreen"/>
</p>

<p align="center"><img src="/preview.png" width="642"/></p>
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>

<!--
<time id="clock"></time>

<script type="module">
  import { $, fx, state } from "https://unpkg.com/spect?module"
  import { $, fx, state } from "https://unpkg.com/spect"

  $('#clock', el => {
    const date = state(new Date())

    fx(() => {
      el.innerHTML = date().toLocaleTimeString()
      el.setAttribute('datetime', date().toISOString())

      setTimeout(() => date(new Date()), 1000)
    }, [date])
  })
</script>
-->


_Spect_ provides a lightweight alternative to industrial frameworks, encompassing best parts with elegant modern API.
Its design is inspired by [_react hooks_](https://reactjs.org/docs/hooks-intro.html), [_observables_](https://www.npmjs.com/package/observable) and [_aspect-oriented-programming_](https://en.wikipedia.org/wiki/Aspect-oriented_programming).

## Principles

:gem: **Separation of concerns** via _aspects_ − compartmental pieces of logic in CSS-like fashion.

:deciduous_tree: **Native first**: semantic HTML, clean DOM tree, vanilla / web components friendly.

:ocean: **Progressive enhancement** via organic layering aspects.

:baby_chick: **Low entry barrier** − no complexity victims.

:dizzy: **0** bundling, **0** server, **0** template − single script with imports is enough.

:shipit: **Low-profile** − no forced structure, useful as utility tool.


## Installation

#### A. Directly as a dule:

```html
<script type="module">
import { $, fx } from 'https://unpkg.com/spect?module'
  
// ... code here
</script>
```

#### B. As dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $ } from 'spect'

// ... code here too
```

_Spect_ plays perfectly with [snowpack](https://www.snowpack.dev/), but any other bundler will do.


## Usage

Here comes intoductory example. Maybe validation / sending form? 

<!--

_Spect_ doesn't make any guess about storage, actions, renderer or tooling setup and can be used with different flavors.

#### Vanilla

```js
import { $ } from 'spect'

// touched inputs
$('input', el => el.addEventListener('focus', e => el.classList.add('touched')))
```

#### Lit-html

```js
import { $, fx, on } from 'spect'
import { render, html } from 'lit-html'

$('input#height', el => {
  fx(e => {
    const value = e.target.value

    render(html`Your height: <strong>${ value }</strong>cm`, hintEl)
  }, [on(el, 'input'), on(el, 'change')])
})
```
--!>

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

### _`$`_

> $( scope? , selector | element, aspect )

_**`$`**_ is selector observer effect. It assigns an `aspect` function to `selector` or `element`. The `aspect` is triggered when an element matching the `selector` is mounted, and optional returned callback is called when unmounted or apsect is torn down.

* `selector` should be a valid CSS selector.
* `element` can be an _HTMLElement_ or a list of elements (array or array-like).
* `aspect` is a function with `target => teardown` signature, or an array of functions.
* `scope` is optional container element to assign mutation observer to, by default that is `document`.

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

### _`fx`_

> fx( callback, deps = [ Promise.resolve() ] )

_**`fx`**_ is generic effect. It reacts to changes in `deps` and runs `callback`, much like _useEffect_.

`callback` is a function with `(...args) => teardown` signature.

`deps` list expects:

* _Async Generator_ / _Async Iterable_ / object with [`Symbol.asyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) method;
* _Promise_ / _Thenable_;
* _Observable_ / an object with `.subscribe` method ([rxjs](https://ghub.io/rxjs) / [any-observable](https://ghub.io/any-observable) / [zen-observable](https://ghub.io/zen-observable) etc);
* _Function_ is considered an [observable](https://ghub.io) / [observ](https://ghub.io) / [mutant](https://ghub.io/mutant);
* any other value is considered constant.

Resolved deps values are passed as arguments to `callback`. Returned `teardown` function is used as destructor when the `state` changes.
Omitted deps run effect only once as microtask.

```js
import { state, fx } from 'spect'
import { time } from 'wait-please'

let count = state(0)

fx(async c => {
  console.log('Seconds', c)
  await time(1000)
  count(c + 1)
}, [count])

// called once
fx(() => {})

// never called
fx(() => {}, [])
```

<br/>

### _`state`_

> value = state( init? )

_**`state`**_ creates an observable value that is simply a getter/setter function with [_asyncIterator_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface. `init` can be an initial value or an initializer function.
_**`state`**_ acts as _useState_ hook, or [observable](https://ghub.io/observable).

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

<br/>


### _`calc`_

> value = calc( state => result, deps = [] )

Creates an observable value, computed from `deps`. Similar to _**`fx`**_, but the result is observable. _**`calc`**_ is analog of _useMemo_.

```js
import { $, input, calc } from 'spect'

const f = state(32), c = state(0)
const celsius = calc(f => (f - 32) / 1.8, [f])
const fahren = calc(c => (c * 9) / 5 + 32, [c])

celsius() // 0
fahren() // 32
```

<br/>

### _`prop`_

> value = prop( target, name )

_**`prop`**_ is target property observable and accessor. _**`prop`**_ keeps safe target's own getter/setter, if defined.

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

### _`attr`_

> value = attr( element, name )

Element attribute observable. Similar to _**`prop`**_, it provides access to attribute value and emits changes.

```js
import { fx, attr } from 'spect'

fx(loading => {
  console.log(loading)
}, [attr(el, 'loading')])
```

<br/>

### _`store`_

> obj = store( init = {} )

Observable object. Unlike _**`state`**_, creates a proxy for the object − adding, changing, or deleting its properties emits changes. Similar to _Struct_ in [mutant](https://ghub.io/mutant).

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

### _`on`_

> evts = on( element, eventName )

Stateless events async iteratable. Comes handy for event-based effects. To stop observing, invoke `evts.cancel()`.

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

  fx(validate, [ value, focus ])

  return () => on.cancel( )
})
```

<br/>

### _`ref`_

> value = ref( init? )

_**`ref`**_ is core value observer, serves as a foundation for other observables. Unlike _**`state`**_, it does not support functional setter and emits every set value.  _**`ref`**_ is a direct analog of _useRef_ hook.

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

// observe changes
for await (const c of count) {
  // 1, ...
}

// discard observable, end generators
count.cancel()
```

<br/>

<!-- Best of React, jQuery and RxJS worlds in a tiny tool. -->

## Inspiration / R&D

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.
* [observable](https://ghub.io/observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant) − elegant observable implementation.
* [zen-observable](https://ghub.io/zen-observable), [es-observable](https://ghub.io/es-observable) et all − foundational research / proposal.
* [reuse](https://ghub.io/reuse) − aspects attempt for react world.
* [tonic](https://ghub.io/tonic), [etch](https://ghub.io/etch), [turbine](https://github.com/funkia/turbine), [hui](https://ghub.io/hui) − nice takes on web-component framework.
* [atomico](https://ghub.io/atomico), [haunted](https://ghub.io/haunted), [fuco](https://ghub.io/fuco) − react-less hooks implementations.

<p align="right">HK</p>

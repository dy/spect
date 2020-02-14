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


_Spect_ is alternative framework, inspired by [_react hooks_](https://reactjs.org/docs/hooks-intro.html), [_observables_](https://www.npmjs.com/package/observable) and [_aspect-oriented-programming_](https://en.wikipedia.org/wiki/Aspect-oriented_programming).

## Principles

:gem: **Separation of concerns** − _aspects_ are compartmental pieces of logic, declared in CSS-like fashion.

:deciduous_tree: **Native first** − semantic HTML, clean tree, vanilla friendly.

:ocean: **Progressive enhancement** − multiple layered aspects organically augment features.

:baby_chick: **Low entry barrier** − no complexity victims or hostages.

:dizzy: **0** bundling, **0** server, **0** template − single script with imports is enough.

:shipit: **Low-profile** − doesn't force structure or stack, can be used as utility.


## Installation

#### A. Directly as a module:

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

Work in progress.

<!--
Here comes intoductory example.

Maybe validation / sending form? (better for cases, eg. forms (all react cases))

Or familiar examples of another framework, rewritten with spect? (better for docs, as spect vs N)

Something showcasing wow features, like composable streaming and how that restructures waterfall rendering?
Yes, makes more sense. The very natural flow, where with HTML you can prototype, then naturally upgrade to UI-framework, then add actions. Minimize design - code distance.


!? Maybe hello, world user as starter?
--!>

<!--
Let's start off with an app, displaying a [list of users].

First, create semantic HTML you'd regularly do without js.

```html
<!doctype html>

<template id="article">
  <article>
  </article>
</template>

<main>
  <div id="articles">
  </div>
</main>
```

Second, make data loading circuit.

```js
<script type="module">
import { $, html, store } from 'https://unpkg.com/spect?module'

const articles = store({
  items: [],
  load() {
    this.loading = true
    this.items = await (await fetch(url)).json()
    this.loading = false
  }
})

$('#articles', el => {
  html`<${el}>${
    articles.map(item => html``)
  }</>`
})
</script>
```

!Showcase how easy that is to render with `html` effect.
--!>

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

_**`$`**_ is selector observer with callback. It assigns an `aspect` function to `selector` or `element`. The `aspect` callback is triggered when an element matching the `selector` is mounted, and optional returned callback is called when unmounted.

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

> fx( callback, deps = [ nextTick ] )

_**`fx`**_ is generic effect. It reacts to events in `deps` and runs `callback`, much like _useEffect_.

<!-- _**`dfx`**_ is delta _**`fx`**_ it reacts only to changed state. -->

`callback` is a function with `(...args) => teardown` signature.

`deps` list expects:

* _Async Generator_ / _Async Iterable_ / object with [`Symbol.asyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) method;
* _Promise_ / _Thenable_;
* _Observable_ / an object with `.subscribe` method ([rxjs](https://ghub.io/rxjs) / [any-observable](https://ghub.io/any-observable) / [zen-observable](https://ghub.io/zen-observable) etc);
* _Function_ is considered an [observable](https://ghub.io) / [observ](https://ghub.io) / [mutant](https://ghub.io/mutant);
* any other value is wrapped as `Promise.resolve(value)`.

When any dep resolves, effect invokes the `callback` with resolved deps values as arguments. Returned `teardown` function can be used as destructor of the previous state.
Omitted deps run effect only once as microtask.

```js
import { state, fx } from 'spect'
import { time } from 'wait-please'

let count = state(0)

// triggers whenever `count` changes
fx((count) => {
  console.log(count)
}, [count])
count(1)
setTimeout(() => count(2), 1000)

// called once
fx(() => {})

// never called
fx(() => {}, [])

// timer
fx(async c => {
  console.log('Seconds', c)
  await time(1000)
  count(c + 1)
}, [count])
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

// observe changes
for await (let value of count) {
  // 0, 1, ...
}

// current value
count.current

// run effect
fx(c => {
  console.log(c)
}, [count])
```

<br/>


### _`calc`_

> value = calc( state => result, deps = [] )

Creates an observable value, computed from `deps`. Similar to _**`fx`**_, but returns an observable value. _**`calc`**_ is analog of _useMemo_.

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

_**`prop`**_ is target property accessor emitting changes. _**`prop`**_ keeps safe target's own getter/setter, if defined.

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

Observable object. Unlike _**`state`**_, creates a proxy for the object − adding, changing, or deleting properties emits changes. Changing sub-properties doesn't trigger updates. Similar to _Struct_ in [mutant](https://ghub.io/mutant).

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

### _`list`_

> arr = list([ ...items ])

Similar to _**`store`**_, intended for collections. Same as _Array_, but emits changes on any mutations.

```js
import { list } from 'spect'

let arr = list([])

// set
arr[3] = 'foo'

// mutator methods
arr.push('bar', 'baz')
arr.unshift('qux')

// listen to changes
for await (const items of arr) {
  console.log(items)
}
```


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

### _`input`_

> let value = input( element )

Input element value observable. Emits stream of values, changed by user. The result is stateful, ie. it emits the initial value, unlike _**`on`**_.

```js
import { fx, input } from 'spect'

fx(value => {
  console.log(`Value: ${value}`)
}, [input(el)]
```

<br/>

### _`html`_

> let el = html`<tag ...${ props }>${ content }</>`
> let el = html`<${ target }` ...${ props }>${ content }</>`

HTML effect. Connects observables or constants to html. Returns an element that updates itself whenever input `props` or `content` change. That way _**`html`**_ doesn't require additional calls to rerender content.
_**`html`**_ syntax is compatible with [htm](https://ghub.io/htm).

```js
import { html, fx } from 'spect'

// create new observable element
const foo = html`<foo ${bar}=${baz} ...${qux}>${ xyzzy }</foo>`

// hydrate existing element with `foo` as content
const bat = html`<${document.querySelector('#bat')} ${bar}=${baz}>${ foo }</>`

// trigger effect whenever `foo` or `bat` updates
fx(bat => {
  console.log('updated', bat)
}, [bat])
```

<br/>

### _`ref`_

> value = ref( init? )

_**`ref`**_ is core value container, serves as foundation for other observables. Unlike _**`state`**_ emits value every set call.  _**`ref`**_ is direct analog of _useRef_ hook.

```js
import { ref } from 'spect'

let count = ref(0)

// get
count()

// set
count(1)

// observe setting value
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
* [tonic](https://ghub.io/tonic), [etch](https://ghub.io/etch), [turbine](https://github.com/funkia/turbine), [hui](https://ghub.io/hui) − nice takes on web-component frameworks.
* [atomico](https://ghub.io/atomico), [haunted](https://ghub.io/haunted), [fuco](https://ghub.io/fuco), [hooked-elements](https://github.com/WebReflection/hooked-elements) − react-less hooks implementations.

<br/>

<p align="center">ॐ</p>

<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  <em>Aspect-oriented</em> DOM framework with _effects_ and _observables_.<br/>
  <!-- Build reactive UIs with rules, similar to CSS.<br/> -->
  <!-- Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/> -->
</p>
<p align="center">
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a>
  <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>
  <img src="https://img.shields.io/badge/stability-unstable-yellowgreen"/>
</p>

<p align="center"><img src="/preview.png" width="633"/></p>
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>

<!--
<time id="clock"></time>

<script type="module">
  import { $, html, state, fx } from "https://unpkg.com/spect"

  $('#clock', el => {
    const date = state(new Date())

    html`<${el} datetime=${ date }>
      ${() => date().toLocaleTimeString()}
    </>`

    fx(() => {
      setTimeout(() => {
        date(new Date())
      }, 1000)
    }, [date])
  })
</script>
-->


_Spect_ is state-of-the-art DOM framework, putting together _aspects_, _observables_ and _effects_ in symbiotic way. It is inspired by the best parts of [_react hooks_](https://reactjs.org/docs/hooks-intro.html), [_observables_](https://www.npmjs.com/package/observable) and [_aspect-oriented programming_](https://en.wikipedia.org/wiki/Aspect-oriented_programming), with simplicity of [jquery](https://ghub.io/jquery).

## Principles

:gem: **Separation of concerns** − comes naturally with _aspects_ − small pieces of logic assigned to elements.

:deciduous_tree: **Native first** − keeps semantic HTML, clean tree without wrappers, vanilla-components friendly.

:ocean: **Progressive enhancement** − aspect combinations provide additional functionality.

:baby_chick: **Low entry barrier** − no complexity victims or hostages.

:dizzy: **0** bundling, **0** server, **0** template − an html page with `<script>` is enough to get started.

:shipit: **Low-profile** − doesn’t force structure or stack, can be used as utility.


## Installation

#### A. Directly as a module:

```html
<script type="module">
import { $ } from 'https://unpkg.com/spect?module'

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

Let's start with simple user welcoming example.

```js
<div class="user">Loading...</div>

<script type="module">
import { $, html, state } from 'spect'

$('.user', async el => {
  const username = state()
  html`<${el}>Hello, ${ username }!</>`

  const user = await (await fetch('/user')).json()
  username(user.name)
})
</script>
```

Here, the _**`$`**_ assigns an aspect function to the `.user` element. That function awaits `username` to be loaded from the server and displays it as the element's inner html. _**`state`**_ here acts as _useState_, but creates an observable `username` value. _**`html`**_ is reactive − it rerenders automatically whenever `username` changes.


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

<table>
  <tbody>
    <tr>
      <td><strong>Effects:</strong></td>
      <td>
        <a href="#$"><strong><em><code>$</code></em></strong></a> ⋅
        <a href="#on"><strong><em><code>on</code></em></strong></a> ⋅
        <a href="#fx"><strong><em><code>fx</code></em></strong></a> ⋅
        <a href="#html"><strong><em><code>html</code></em></strong></a>
      </td>
    </tr>
    <tr>
      <td><strong>Sources:</strong></td>
      <td>
        <a href="#state"><strong><em><code>state</code></em></strong></a> ⋅
        <a href="#store"><strong><em><code>store</code></em></strong></a> ⋅
        <a href="#list"><strong><em><code>list</code></em></strong></a> ⋅
        <a href="#prop"><strong><em><code>prop</code></em></strong></a> ⋅
        <a href="#attr"><strong><em><code>attr</code></em></strong></a> ⋅
        <a href="#input"><strong><em><code>input</code></em></strong></a> ⋅
        <a href="#calc"><strong><em><code>calc</code></em></strong></a>
      </td>
    </tr>
    <tr>
      <td><strong>Utils:</strong></td>
      <td>
        <a href="#ref"><strong><em><code>ref</code></em></strong></a> ⋅
        <a href="#channel"><strong><em><code>channel</code></em></strong></a>
      </td>
    </tr>
  </tbody>
  </table>

<!--
**Effects:**
[_**`$`**_](#$) ⋅
[_**`on`**_](#on) ⋅
[_**`fx`**_](#fx)

**Sources:**
[_**`state`**_](#state) ⋅
[_**`store`**_](#store) ⋅
[_**`list`**_](#list) ⋅
[_**`attr`**_](#attr) ⋅
[_**`prop`**_](#prop) ⋅
[_**`calc`**_](#calc) ⋅
[_**`input`**_](#input) ⋅
[_**`html`**_](#html)

**Util:**
[_**`ref`**_](#ref) ⋅
[_**`channel`**_](#channel)
-->


## Effects

### _`$`_

> $( scope? , selector | element, callback )

Selector effect. Any time an element matching the `selector` appears in DOM, _**`$`**_ runs the `callback` function. The `callback` can return a teardown function that runs when the element is unmatched.

* `selector` is a valid CSS selector.
* `element` is _HTMLElement_ or a list of elements (array or array-like).
* `callback` is a function with `(element) => teardown?` signature, or an array of such functions.
* `scope` is optional container element to observe, by default that is `document`.

```js
import { $ } from 'spect'

$('foo', el => {
  console.log('active')
  return () => {
    console.log('inactive')
  }
})

let el = document.createElement('foo')
document.body.appendChild(el)

// logs "active"

el.replaceWith(null)

// logs "inactive"
```

#### Example

```js
import { $ } from 'spect'

const timer = $('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    el.innerHTML = `Seconds: ${count++}`
  }, 1000)
  return () => clearInterval(id)
})

// wait until `.timer` element appears in the tree
await timer

// dispose `.timer` aspect
timer.cancel()
```

<br/>

### _`on`_

> on( scope?, target | selector, event, callback? )

Event effect. Runs `callback` by events on a `target` element or `selector`. For the `selector` case it delegates events to `scope` container, by default `document`.

```js
import { on } from 'spect'

// target events
on(document.querySelector('button'), 'click', e => {
  console.log('clicked', e)
})

// delegate events
const submit = on('form', 'submit', e => console.log(e))

// wait for a 'submit' event
const e = await submit

// cancel submit events listener
submit.cancel()

// multiple events
on('.draggable', 'touchstart mousedown', e => {})
```

#### Example

```js
import { on } from 'spect'

const ticks = on('.timer', 'tick', e => {
  console.log('Seconds', e.detail.count)
})

let count = 0, timer = document.querySelector('.timer')
setInterval(() => {
  timer.dispatchEvent(new CustomEvent('tick', { detail: ++count}))
}, 1000)

// await the next 'tick' event
await ticks

// cancel ticks listener
ticks.cancel()
```

<br/>


### _`fx`_

> fx( callback, deps = [ tick ] )

Generic effect. Reacts to `deps` and runs `callback` function with `(...args) => teardown` signature.
Similar to _useEffect_, but `deps` are changeables, any of:
<!-- _**`dfx`**_ is delta _**`fx`**_ it reacts only to changed state. -->

* _Source_
* _AsyncGenerator_ or [_async iterable_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
* _Promise_ or _thenable_
* _Observable_ or _subscribable_, eg. [rxjs](https://ghub.io/rxjs), [es-observable](https://ghub.io/es-observable), [zen-observable](https://ghub.io/zen-observable) etc.
* [observable](https://ghub.io), [observ](https://ghub.io) or [mutant](https://ghub.io/mutant)
* [_Stream_](https://nodejs.org/api/stream.html)
* _Function_, that is called when other dependencies change
* other value is considered constant.

When any dependency updates, the `callback` runs with new arguments, invoking previous `teardown` function. Omitted `deps` trigger `callback` only once as microtask.

```js
import { state, fx } from 'spect'
import { time } from 'wait-please'

let a = state(0), b = state('foo')

fx((a, b) => {
  console.log('in', a, b)
  return () => console.log('out', a, b)
}, [a, b])

setTimeout(() => (a(1), b('bar')), 1000)

// 'in' 0 'foo'
// ...
// 'out' 0 'foo'
// 'in' 1 'bar'

// runs only once
fx(() => {})

// never runs
fx(() => {}, [])
```

#### Example

```js
import { fx } from 'spect'
import { time } from 'wait-please'

// timer
const timer = fx(async c => {
  console.log('Seconds', c)
  await time(1000)
  count(c + 1)
}, [count])

// await next count
await timer

// cancel effect
timer.cancel()
```

<br/>


### _`html`_

> let el = html\`<tag ...${ props }>${ content }</>\`

HTML effect. Renders markup automatically when input fields update. Fields can be the same as _**`fx`**_ arguments.
Syntax is compatible with [htm](https://ghub.io/htm).

```js
import { html, fx, text } from 'spect'

const text = state('foobar')

// create element
const foo = html`<foo>${ text }</foo>`

// hydrate element with `foo` as content
const bar = html`<${document.querySelector('#bar')}>${ foo }</>`

// runs when `bar` updates
fx(bar => {
  console.log('updated', bar.innerHTML)
}, [bar])

// update
text('bazqux')
```

#### Example

```js
import { $, state, html } from 'spect'

$('.timer', el => {
  const count = state(0)
  setInterval(() => count(count + 1))
  html`<${el}>Seconds: ${ count }</>`
})
```


<br/>



## Sources

### _`state`_

> value = state( init? )

_**`state`**_ is a value source. It is a getter/setter function with [_AsyncIterator_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) interface for observing changes. `init` is optional initial value.
_**`state`**_ acts as _useState_ hook and has similar to [observable](https://ghub.io/observable) API. Useful as component state, eg. visibility etc.

```js
import { state, fx } from 'spect'

let count = state(0)

// get
count()

// set
count(1)
count(prev => prev + 1)

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


### _`store`_

> obj = store( init = {} )

_**`store`**_ is object source. Unlike _**`state`**_, it returns an object − adding, changing, or deleting its properties emits changes. Useful as model.

```js
import { store, fx } from 'spect'

const foo = store({ foo: null })

// set
foo.foo = 'bar'
foo.baz = ['boo']

// log changes
fx(({ foo, ...bax }) => {
  console.log(foo, bax)
}, [foo])

// { foo: 'bar', baz: 'boo' }

// doesn't update store
foo.baz[1] = 'far'

// can have methods
foo.plugh = function () { this.foo += 'x' }
```

<!--
#### Example

```js
import { store } from 'spect'

let likes = store({
  count: null,
  loading: false,
  async load() {
    this.loading = true
    this.count = await (await fetch('/likes')).json()
    this.loading = false
  }
})

$('.likes-count', el => {
  fx(async () => {
    render(likes.loading ? html`Loading...` : html`Likes: ${ likes.count }`, element)
  }, [likes])
})
```
-->

<br/>


### _`list`_

> arr = list([ ...items ])

_**`list`**_ is array source, similar to _**`store`**_, but intended for collections. Emits changes on any mutations. Useful for rendering multiple items.

```js
import { list } from 'spect'

let arr = list([])

// set
arr[3] = 'foo'

// mutate
arr.push('bar', 'baz')
arr.unshift('qux')

// ...changes
for await (const items of arr) {
  console.log(items)
}

// returns new live list instance
let mapped = arr.map(x => x * 2)
```

<br/>


### _`prop`_

> value = prop( target, name )

_**`prop`**_ is target property accessor/source. _**`prop`**_ keeps safe target's own getter/setter, if defined. Useful to react to element properties changes.

```js
import { prop, fx } from 'spect'

let obj = { foo: 'bar' }
let foos = prop(obj, 'foo')

// log changes
fx(foo => console.log(foo), [foos])

// set
obj.foo = 'baz'
foos('qux')

// get
foos() // qux

// forget
foos.cancel()
```

<br/>

### _`attr`_

> value = attr( element, name )

_**`attr`**_ is element attribute accessor/source. Similar to _**`prop`**_, it provides access to attribute value and emits changes. Useful to access/react to element attribute values.

```js
import { fx, attr } from 'spect'

const loading = attr(document.querySelector('button'), 'loading')

// react to changes
fx(loading => {
  console.log(loading)
}, [loading])

// set
loading(true)

// get
loading()

// remove attribute
loading(null)

// dispose accessor
loading.close()
```

<br/>

### _`input`_

> value = input( element )

Input element current value source. Useful to track user input.

```js
import { $, fx, input } from 'spect'

$('input', el => {
  const inputValue = input(el)

  fx(value => {
    console.log(`Value`, value)
  }, [inputValue]

  // to update `inputValue` dispatch event
  el.value = 3
  el.dispatch(new Event('change'))
})

```

<br/>


### _`calc`_

> value = calc( state => result, args = [] )

Source computed from `args`. Similar to _**`fx`**_, but synchronous and creates _source_ as result. Analog of _useMemo_.

```js
import { $, input, calc } from 'spect'

const f = state(32), c = state(0)
const celsius = calc(f => (f - 32) / 1.8, [f])
const fahren = calc(c => (c * 9) / 5 + 32, [c])

celsius() // 0
fahren() // 32
```

<br/>


## Utils


### _`ref`_

> value = ref( init? )

Value container, emits every _set_ call. Thenable, Cancelable, AsyncIterable. _**`ref`**_ is direct analog of _useRef_ hook.

```js
import ref from 'spect/ref'

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

### _`channel`_

> ch = channel( callback, onCancel )

Event bus. Thenable, Cancelable, AsyncIterable.

```js
import channel from 'spect/channel'

let foobus = channel(
  e => console.log('received', e),
  reason => console.log('canceled', reason)
)

// post to channel
foobus('a')
foobus('b')

// subscribe to channel
for await (let e of foobus) {
  console.log(e)
}

// close channel
foobus.cancel()
```

<br/>


## Inspiration / R&D

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.
* [observable](https://ghub.io/observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant) − elegant observable implementation.
* [zen-observable](https://ghub.io/zen-observable), [es-observable](https://ghub.io/es-observable) et all − foundational research / proposal.
* [reuse](https://ghub.io/reuse) − aspects attempt for react world.
* [tonic](https://ghub.io/tonic), [etch](https://ghub.io/etch), [turbine](https://github.com/funkia/turbine), [hui](https://ghub.io/hui) − nice takes on web-component frameworks.
* [atomico](https://ghub.io/atomico), [haunted](https://ghub.io/haunted), [fuco](https://ghub.io/fuco), [hooked-elements](https://github.com/WebReflection/hooked-elements) − react-less hooks implementations.
* [jquery](https://ghub.io/jquery) − the old school spaghettiful DOM aspects.

<br/>

<p align="center">ॐ</p>

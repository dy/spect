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

<p align="center"><img src="/preview.png" width="624"/></p>
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>

<!--
<time id="clock"></time>

<script type="module">
  import { $, h, f, state, calc } from "https://unpkg.com/spect"

  $('#clock', el => {
    const date = state(new Date())

    html`<${el} datetime=${ date }>${
      f(date, date => date.toLocaleTimeString())
    }</el>`

    let id = setInterval(() => date(new Date()), 1000)
    return () => clearInterval(id)
  })
</script>
-->


_Spect_ is [_aspect-oriented_](https://en.wikipedia.org/wiki/Aspect-oriented_programming) FRP framework, a successor of [_observable_](https://www.npmjs.com/package/observable) inspired by [_react hooks_](https://reactjs.org/docs/hooks-intro.html) and [_jquery_](https://ghub.io/jquery). It is compatible with [standard observable](https://github.com/tc39/proposal-observable) and [observ](https://ghub.io/observ)-[*](https://ghub.io/mutant).

## Principles

:gem: **Separation of cross-cutting concerns** via _aspects_ − fragments of logic assigned to elements.

:deciduous_tree: **Native first** − cares about semantic clean tree and encourages native API, vanilla friendly.

:ocean: **Progressive enhancement** − multiple aspects provide layers of functionality.

:baby_chick: **Low entry barrier** − no complexity hostages and bureacratic code.

:dizzy: **0** bundling, **0** server, **0** template − an html page with `<script>` is enough.

:shipit: **Low-profile** − doesn’t force stack and can be used as utility.


## Installation

#### A. Directly as a module:

```html
<script type="module">
import { $, h, f } from 'https://unpkg.com/spect?module'

// ... code here
</script>
```

#### B. As dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, h, f } from 'spect'

// ... code here too
```

_Spect_ plays perfectly with [snowpack](https://www.snowpack.dev/), but any other bundler will do.


## Usage

Consider simple user welcoming example.

```js
<div class="user">Loading...</div>

<script type="module">
import { $, html, state, f } from 'spect'

$('.user', async el => {
  const user = f((await fetch('/user')).json())

  html`<${el}>${ f(user, u => u ? `Hello, ${u.name}` : `Loading...`) }!</>`
})
</script>
```

The `$` assigns an _aspect callback_ to the `.user` element. `state` here acts as _useState_, storing `user` in observable container. `html` is reactive − it rerenders automatically whenever the `user` changes. `f` is mapping function - it maps any changeable value (promise in this case) to observable.

<!--
Consider simple todo app.

```js
<form class="todo">
  <label for="add-todo">
    <span>Add Todo</span>
    <input name="text" required/>
  </label>
  <button type="submit">Add</button>
  <ul class="todo-list"><ul>
</form>

<script type="module">
import { $, html, on, list } from 'spect'

const todos = list([])

$('.todo-list', el => html`<${el}>${ todos }</>`)

$('.todo-form', el => on(el, 'submit', e => {
  e.preventDefault()
  if (!el.checkValidity()) return
  todos.push({ text: e.elements.text.value })
  el.reset()
}))
</script>
```

Input element here is uncontrolled and logic closely follows native js to provide _progressive enhancement_. _**`list`**_ creates an observable array `todos`, mutating it automatically rerenders _**`html`**_.
-->

See all [/examples](examples).

<!--
See all examples...

Maybe validation / sending form? (better for cases, eg. forms (all react cases))

Or familiar examples of another framework, rewritten with spect? (better for docs, as spect vs N)

Something showcasing wow features, like composable streaming and how that restructures waterfall rendering?
Yes, makes more sense. The very natural flow, where with HTML you can prototype, then naturally upgrade to UI-framework, then add actions. Minimize design - code distance.
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

<details><summary><strong>$</strong></summary>

> let elements = $( scope? , selector | element, callback? )

Selector observer, creates live collection of elements matching the `selector`. Optional `callback` runs for each new element matching the selector. If `callback` returns a teardown, it is run when the element is unmatched.

* `selector` is a valid CSS selector.
* `element` is _HTMLElement_ or a list of elements (array or array-like).
* `callback` is a function with `(element) => teardown?` signature.
* `scope` is optional container element to observe, by default that is `document`.
* `elements` is live array with matched elements (similar to [HTMLCollection](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCollection)).

```js
import { $ } from 'spect'

let $foo = $('foo', el => {
  console.log('active')
  return () => console.log('inactive')
})

let foo = document.createElement('foo')
document.body.appendChild(foo)
// > "active"

foo.replaceWith(null)
// > "inactive"

$foo[0] === foo
// > true
```

#### Example

```js
import { $ } from 'spect'

const $timer = $('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    el.innerHTML = `Seconds: ${count++}`
  }, 1000)
  return () => clearInterval(id)
})

$timer[0]
// > <div.timer></div>
```
</details>


<details><summary><strong>h</strong>, <strong>html</strong></summary>

> let el = h('tag', props, ...children)
> let el = html\`...content\`

_**`h`**_ is **h**yperscript constructor. Compatible with [hyperscript](https://ghub.io/hyperscript) et al. Can be used via JSX.

_**`html`**_ is **h** **t**agged **m**arkup **l**iteral sugar,  _**`html`**_ = [_**`htm`**_](https://ghub.io/xhtm) + _**`h`**_.

```js
import { h, fx, text } from 'spect'

const text = state('foobar')

// create element
const foo = h('foo', {}, text)

// create jsx
/* jsx h */
const bar = <bar>{ text }</bar>

// update
text('fooobar')


// create element
const foo = html`<baz>${ text }</baz>`

// create multiple elements
const [foo1, foo2] = html`<foo>1</foo><foo>2</foo>`

// create document fragment
const fooFrag = html`<><foo/></>`

// hydrate element
const foo = html`<${foo}>${ bar }</>`
```

#### Example

```js
import { $, v, html } from 'spect'

$('.timer', el => {
  const count = v(0)
  setInterval(() => count(count + 1))
  html`<${el}>Seconds: ${ count }</>`
})
```

</details>


<details><summary><strong>v</strong></summary>

> value = v( init? )

_**`v`**_ is simply observable value − a getter/setter function, fully compatible with [observable](https://ghub.io/observable) API.
It acts as _useState_ hook. Useful as component state, eg. visibility etc.

```js
import { v } from 'spect'

let count = v(0)

// get
count()

// set
count(1)

// observe changes
count(value => {
  // 0, 1, ...

  return () => {
    // ...teardown
  }
})
```

</details>


<details><summary><strong>f</strong></summary>

> obv = f( source, map? )

Create a readable observable from any source:

* _Constant_ value
* Subscribable _function_ ([observ-*](https://ghub.io/observ), [observable](https://ghub.io/observable), [mutant](https://ghub.io/mutant) etc.)
* _AsyncIterator_ or [_async iterable_](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator)
* _Promise_ or _thenable_
* _Observable_ ([rxjs](https://ghub.io/rxjs), [es-observable](https://ghub.io/es-observable), [zen-observable](https://ghub.io/zen-observable) etc.)
* Node [_stream_](https://nodejs.org/api/stream.html)
* Any combination of the above as _array_.

Optional `map` function transforms returned value. _**`from`**_ can be used as _**`useMemo`**_ or _**`useEffect`**_.

```js
import { v, f } from 'spect'

let v1 = v(1)

// from single value
let v2 = f(v1, v1 => v1 * 2)
v2() // 2

// from multiple values
let v3 = f([v1, v2], ([v1, v2]) => v1 + v2)
v3() // 3

// run effect on every change
f([v1, v2, v3])(([v1, v2, v3]) => {
  console.log('in', v1, v2, v3)
  return () => console.log('out', v1, v2, v3)
})
```

#### Example

```js
import { f, v, h } from 'spect'

let date = v(new Date())
setInterval(() => date(new Date()), 1000)
f(date, date => date.toISOString())(console.log)
```

#### Example 2

```js
import { $, input, from } from 'spect'

const f = input(...$('#fahrenheit')), c = input(...$('#celsius'))
const celsius = from(f, f => (f - 32) / 1.8)
const fahren = from(c, c => (c * 9) / 5 + 32)

celsius() // 0
fahren() // 32
```

</details>



<details><summary><strong>prop</strong></summary>

> value = prop( target, name )

_**`prop`**_ is target property observable / accessor. It keeps safe target's own getter/setter, if defined. Useful to react to element properties changes.

```js
import { prop, fx } from 'spect'

let obj = { foo: 'bar' }
let foos = prop(obj, 'foo')

// log changes
foos(foo => console.log(foo))

// set
obj.foo = 'baz'
foos('qux')

// get
foos() // qux

// forget
foos.cancel()
```

</details>

<details><summary><strong>attr</strong></summary>

> value = attr( element, name )

_**`attr`**_ is element attribute observable / accessor. Similar to _**`prop`**_, but observes attribute changes.

```js
import { attr } from 'spect'

const loading = attr(document.querySelector('button'), 'loading')

// react to changes
attr(loading => {
  console.log(loading)
})

// set
loading(true)

// get
loading()

// remove attribute
loading(null)

// dispose accessor
loading.close()
```

</details>


<details><summary><strong>on</strong></summary>

> on( scope?, target | selector, event, callback? )

Stateless event observable, runs `callback` on `target` events or by `selector`. For the `selector` case it delegates events to `scope` container, by default `document`.

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

</details>



<details><summary><strong>input</strong></summary>

> value = input( element )

Input element value observable, useful to track user input. Works with text inputs, checkboxes, radio and select.

```js
import { $, f, input } from 'spect'

const val = input(...$('input'))

val(value => console.log(`Value`, value))

el.value = 3
el.dispatch(new Event('change'))
```

</details>


<details><summary><strong>store</strong></summary>

> obj = store( init = {} )

_**`store`**_ is observable object/array. Adding, changing, or deleting its properties emits changes. Useful as app model.

```js
import { store, f } from 'spect'

const foo = store({ foo: null })

// set props
foo.foo = 'bar'
foo.baz = ['boo']

// log changes
f(foo)({ foo, ...bax }) => console.log(foo, ...bax))
// > { foo: 'bar', baz: 'boo' }


// collection
let arr = store([])

// set item
arr[3] = 'foo'

// mutate
arr.push('bar', 'baz')
arr.unshift('qux')

// log changes
f(arr, arr => console.log(arr))
```

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

$('.likes-count', el => html`<${el}>${
    f(likes, ({loading, count}) => loading ? `Loading...` : `Likes: ${ likes.count }`)
  }</>`
})
```

</details>

<!--
<details><summary><strong>cancel</strong></summary>

> cancel( ...observables )

Cancel observables in the list.

```js
import { $, cancel } from 'spect'

let $items = $('.item')
let clicks = on($items, 'click')

cancel($items, clicks)
```

#### Example

```js
import { from } from 'spect'

let date = state(new Date())
setInterval(() => date(new Date()), 1000)
from(date, date => date.toISOString())(date => console.log(date))
```

</details>
-->


<!--
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
-->


## Inspiration / R&D

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.
* [observable](https://ghub.io/observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant) − elegant observable implementation.
* [zen-observable](https://ghub.io/zen-observable), [es-observable](https://ghub.io/es-observable) et al − foundational research / proposal.
* [reuse](https://ghub.io/reuse) − aspects attempt for react world.
* [tonic](https://ghub.io/tonic), [etch](https://ghub.io/etch), [turbine](https://github.com/funkia/turbine), [hui](https://ghub.io/hui) − nice takes on web-component frameworks.
* [atomico](https://ghub.io/atomico), [haunted](https://ghub.io/haunted), [fuco](https://ghub.io/fuco), [hooked-elements](https://github.com/WebReflection/hooked-elements) − react-less hooks implementations.
* [jquery](https://ghub.io/jquery) − the old school spaghettiful DOM aspects.

<br/>

<p align="center">ॐ</p>

<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  <!--Reactive aspect-oriented web-framework.<br/>-->
  Micro DOM aspects: pieces of logic declared with CSS rules.<br/>
</p>
<p align="center">
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a>
  <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>
  <img src="https://img.shields.io/badge/stability-unstable-yellow"/>
</p>

<p align="center"><img src="/preview.png" width="625"/></p>
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>

<!--
<time id="clock"></time>

<script type="module">
  import { $, h, v } from "https://unpkg.com/spect"

  $('#clock', el => {
    const date = v(new Date())

    h`<${el} datetime=${ date }>
      ${ date.map(d => d.toLocaleTimeString()) }
    </>`

    let id = setInterval(() => date.value = new Date(), 1000)
    return () => clearInterval(id)
  })
</script>
-->

_Spect_ is selector observer, assigning handler for matched nodes in DOM.

:gem: Separation of cross-cutting concerns via **DOM aspects**.

:deciduous_tree: **No native API wrapping** − work directly with HTML tree, vanilla js.

:calling: **Progressive enhancement**-friendly.

:baby_chick: **Familiarity** − no entry barrier.

:dizzy: **No** tooling, **no** boilerplate code, **no** environment setup needed.

:shipit: **Low-profile** - can be used as side-utility, no guesses about storage, actions, renderer, can be used with different flavors.

:golf: Good **performance / size**.


### spect/$

_`$( container=document , selector , handler? )`_

Observe _`selector`_ within _`container`_, call `handler` when matching elements found. Handler can return a teardown function.
Returns live collection of matched elements (hypothetical _SelectorCollection_ API).

```js
import $ from 'spect/$.js'

let foos = $('.foo', el => {
  console.log('active')
  return () => console.log('inactive') // teardown
})

let foo = document.createElement('div')
foo.className = 'foo'
document.body.append(foo)
// ... "active"

foo.remove()
// ... "inactive"

foos.dispose() // destroy selector observer
```

### spect/h

_`` el = h`...content` ``_

HTML builder with [HTM](https://ghub.io/htm) syntax and reactive fields support: _Promise_, _Async Iterable_, any [Observable](https://github.com/tc39/proposal-observable), [RXjs](https://rxjs-dev.firebaseapp.com/guide/overview), any [observ\*](https://github.com/Raynos/observ) etc.

```jsx
import {h, v} from 'spect'

const text = v('foo') // reactive value (== vue3 ref)
const a = h`<a>${ text }</a>` // <a>foo</a>
text.value = 'bar' // <a>bar</a>

const frag = h`<x ...${{x: 1}}>1</x><y>2</y>`  // htm syntax
h`<${a}>${ frag }</a>` // <a><x x="1">1</x><y>2</y></a>

a[Symbol.dispose]() // destroy observers

/* jsx h */
const a2 = <a>{ rxSubject } or { asyncIterable } or { promise }</a>

h(a, a2) // render/update
```


## Examples

<details><summary>Hello World</summary>

```html
<div class="user">Loading...</div>

<script type="module">
  import $ from './spect.js'
  import v from './vref.js'
  import h from 'hdom'

  $('.user', async el => {
    // create user state
    const user = v({ name: 'guest' })

    // render element content, map user state
    h`<${el}>Hello, ${ user.map(u => u.name) }!</>`

    // load data & set user
    user.value = (await fetch('/user')).json()
  })
</script>
```
</details>

<details><summary>Timer</summary>

```html
<time id="timer"></time>

<script type="module">
  import v from './vref.js'
  import { $, h } from './spect.js'

  $('#timer', timer => {
    const count = v(0), id = setInterval(() => count.value++, 1000)
    h`<${timer}>${ count }</>`
    return () => clearInterval(id)
  })
</script>
```
</details>
    
<details><summary>Counter</summary>
  
```html
<output id="count">0</output>
<button id="inc">+</button><button id="dec">-</button>

<script type="module">
  import { $, h, v } from './spect.js'

  const count = v(0)
  $('#count', el => count.subscribe(c => el.value = c))
  $('#inc', el => el.onclick = e => count.value++)
  $('#dec', el => el.onclick = e => count.value--)
</script>
```
</details>

<details><summary>Todo list</summary>

```html
<form class="todo-form">
  <label for="add-todo">
    <span>Add Todo</span>
    <input name="text" required>
  </label>
  <button type="submit">Add</button>
  <ul class="todo-list"><ul>
</form>

<script type="module">
  import { $, h, v } from './spect.js'

  const todos = v([])
  $('.todo-list', el => h`<${el}>${
    todos.map(items =>
      items.map(item => h`<li>${ item.text }</li>`)
    )
  }</>`)
  $('.todo-form', form => form.addEventListener('submit', e => {
    e.preventDefault()
    if (!form.checkValidity()) return

    todos.value = [...todos.value, { text: form.text.value }]

    form.reset()
  }))
</script>
```
</details>

<details><summary>Form validator</summary>

<!-- TODO: more meaningful validator -->
```html
<form></form>

<script type="module">
  import { $, h, v } from './spect.js'

  const isValidEmail = s => /.+@.+\..+/i.test(s)

  $('form', form => {
    const valid = v(false)
    h`<${form}>
      <label for="email">Please enter an email address:</label>
      <input#email onchange=${ e => valid.value = isValidEmail(e.target.value) }/>
      The address is ${ v(valid, b => b ? "valid" : "invalid") }
    </>`
  })
</script>
```
</details>

<details><summary>Prompt</summary>

```html
<script>
import h from './spect.js'
import v from './vref.js'

const showPrompt = v(false), proceed = v(false)

document.body.appendChild(h`<dialog open=${showPrompt}>
  Proceed?
  <menu>
    <button onclick=${e => (showPrompt.value = false, proceed.value = false)}>Cancel</button>
    <button onclick=${e => (showPrompt.value = false, proceed.value = true)}>Confirm</button>
  </menu>
</>`)
</script>
```
</details>

[See all examples](examples).


## Refs

* **$**: [fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), [qso](https://www.npmjs.com/package/qso), [pure-js](https://pure-js.com/), [element-observer](https://github.com/WebReflection/element-observer) libraries and others.

Spect has long story of research, at v13.0 it had repository reset. See [changelog](./changelog.md).

## Related

* [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components.
* [subscribable-things](https://github.com/chrisguttandin/subscribable-things) − collection of observables for different browser APIs - perfect match with spect.
<!-- * [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc). -->

## License

MIT

<p align="center">ॐ</p>

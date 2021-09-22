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

_Spect_ provides 3 conventional DOM functions − _**$**_, _**h**_ and _**v**_ for dom aspects, reactive html and observable data.

It attempts to follow the principles:

:gem: **Separation of cross-cutting concerns**.

:deciduous_tree: **No native API wrapping** − work directly with HTML tree, vanilla js.

:calling: **Progressive enhancement**-friendly.

:baby_chick: **Familiarity** − no entry barrier.

:dizzy: **No** tooling, **no** boilerplate code, **no** environment setup needed.

:shipit: **Low-profile** - can be used as side-utility, no guesses about storage, actions, renderer, can be used with different flavors.

:golf: Good **performance / size**.

## API

### spect/$

_`$( container=document , selector , handler? )`_

Observe _`selector`_ within _`container`_, call `handler` when matching elements found. Handler can return teardown function.
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

foos[Symbol.dispose]() // destroy selector observer
```

### spect/h

_`` el = h`...content` ``_

HTML builder with [HTM](https://ghub.io/htm) syntax and reactive fields support: _Promise_, _Async Iterable_, any [Observable](https://github.com/tc39/proposal-observable), [RXjs](https://rxjs-dev.firebaseapp.com/guide/overview), any [observ*](https://github.com/Raynos/observ) etc.

```js
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

### spect/v

_`ref = v( init? )`_

Creates reactive mutable _`ref`_ object with a single `.value` property holding internal value. _`ref`_ is identical to vue3 ref with _Observable_ and _AsyncIterable_ interface.

```js
import v from 'spect/v.js'

let count = v(0)
count.value // 0

count.subscribe(value => {
  console.log(value)
  return () => console.log('teardown', value)
})

count.value = 1
// > 1

count.value = 2
// > "teardown" 1
// > 2


let double = count.map(value => value * 2) // create mapped ref
double.value // 4

count.value = 3
double.value // 6


let sum = v(count.value + double.value)
count.subscribe(v => sum.value = v + double.value)
double.subscribe(v => sum.value = count.value + v)

// async iterable
for await (const value of sum) console.log(value)

sum[Symbol.dispose]() // destroy observations
```


## Examples

<details><summary>Hello World</summary>

```html
<div class="user">Loading...</div>

<script type="module">
  import { $, h, v } from 'spect.js'

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
  import { $, v, h } from 'spect.js'

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
  import { $, h, v } from 'spect.js'

  const count = v(0)
  $('#count', el => count.subscribe(c => el.value = c))
  $('#inc', el => el.onclick = e => count.value++)
  $('#dec', el => el.onclick = e => count.value--)
</script>
```
</details>

<details><summary>Todo list</summary>

```html
<form class="todo">
  <label for="add-todo">
    <span>Add Todo</span>
    <input name="text" required>
  </label>
  <button type="submit">Add</button>
  <ul class="todo-list"><ul>
</form>

<script type="module">
  import { $, h, v } from 'spect.js'

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
  import { $, h, v } from 'spect.js'

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
import {v,h} from 'spect.js'

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


<!--
## R&D

Sources of inspiration / analysis:

* **$**: [fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), [pure-js](https://pure-js.com/) libraries and others.
* **h**: [lit-html](https://ghub.io/lit-html), [htm](https://ghub.io/htm), [htl](https://ghub.io/htl), [hyperscript](https://ghub.io/hyperscript), [incremental-dom](https://ghub.io/incremental-dom), [snabbdom](https://ghub.io/snabbdom), [nanomorph](https://ghub.io/nanomorph), [uhtml](https://ghub.io/uhtml) and others.
* **v**: [vue3/ref](https://v3.vuejs.org/api/refs-api.html), [knockout/observable](https://github.com/knockout/tko/issues/22), [mobx/observable](https://mobx.js.org/api.html), [rxjs](https://ghub.io/rxjs), [observable](https://ghub.io/observable), [react hooks](https://ghub.io/unihooks), [observable proposal](https://github.com/tc39/proposal-observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant), [iron](https://github.com/ironjs/iron), [icaro](https://ghub.io/icaro), [introspected](https://ghub.io/introspected), [augmentor](https://ghub.io/augmentor) and others.

Spect has long story of research, at v13.0 it had repository reset. See [changelog](./changelog.md).

## Related

* [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components.
* [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc).
-->
## License

MIT

<p align="center">ॐ</p>

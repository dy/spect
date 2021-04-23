<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  <!--Reactive aspect-oriented web-framework.<br/>-->
  Micro DOM aspects toolkit.<br/>
  <!-- Build reactive UIs with rules, similar to CSS.<br/> -->
  <!-- Each rule specifies an <em>aspect</em> function, carrying a piece of logic.<br/> -->
</p>
<p align="center">
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
  <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a>
  <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>
  <img src="https://img.shields.io/badge/stability-unstable-yellow"/>
</p>

<p align="center"><img src="/preview.png" width="565"/></p>
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

    let id = setInterval(() => date(new Date()), 1000)
    return () => clearInterval(id)
  })
</script>
-->

_Spect_ is minimalistic DOM toolkit, providing [_aspects_](https://en.wikipedia.org/wiki/Aspect-oriented_programming), reactivity and observables with 3 essential canonical functions − _**$**_, _**h**_ and _**v**_, for better compact UI code and efficient manipulations.
<!--, successors of [_jquery_](https://ghub.io/jquery), [_hyperscript_](https://ghub.io/hyperscript) and [_observable_](https://www.npmjs.com/package/observable). -->

:gem: **Separation of cross-cutting concerns** with CSS-like aspects.

:deciduous_tree: **Native first** − healthy semantic HTML tree, vanilla js friendly.

:calling: Unblocked, facilitated **progressive enhancement**.

:baby_chick: **No entry barrier** − already familiar functions.

:dizzy: **0** tooling, **0** boilerplate code, **0** environment setup needed.

:shipit: **Low-profile** − doesn't impose itself, can be used as side-utility; separate modules.

:golf: Good **performance / size** balance.

<!-- _Spect_ doesn't make any guess about storage, actions, renderer or tooling setup and can be used with different flavors. -->

## Installation

### A. Directly as a module:

```html
<script type="module">
import { $, h, v } from 'https://unpkg.com/spect?module'
</script>
```

Available from CDN: [unpkg](https://unpkg.com/spect?module), [pika](https://cdn.pika.dev/spect), [jsdelivr](https://cdn.jsdelivr.net/npm/spect).

### B. As a dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, h, v } from 'spect'
```

## API

### spect/$

_`$( container? , selector , handler? )`_

Assign an aspect _`handler`_ function to a _`selector`_ within the _`container`_ (by default _`document`_). Handler is called for each element matching the _`selector`_, returned function acts as disconnect callback. Returns live collection of matched elements.

```js
import $ from 'spect/$'

// assign an aspect to all .foo elements
let foos = $('.foo', el => {
  console.log('active')
  return () => console.log('inactive')
})

// append .foo element
let foo = document.createElement('div')
foo.className = 'foo'
document.body.append(foo)
// ... "active"

foo.remove()
// ... "inactive"

// destroy selector observer
foos[Symbol.dispose]()
```

### spect/h

_`` el = h`...content` ``_

HTML renderer with [HTM](https://ghub.io/htm) syntax and reactive values support: _Promise_, _Async Iterable_, any [Observable](https://github.com/tc39/proposal-observable), [rxjs](https://rxjs-dev.firebaseapp.com/guide/overview), any [observ*](https://github.com/Raynos/observ), an object with `subscribe` method.

```js
import {h, v} from 'spect'

// create value ref (like vue3)
const text = v('foo')

// create live node
const a = h`<a>${ text }</a>`
a // <a>foo</a>

// update ref value => update node
text.value = 'bar'
a // <a>bar</a>


// HTM syntax is fully supported
const frag = h`<x ...${{x: 1}}>1</x><y>2</y>`

// mount content on another element
h`<${a}>${ frag }</a>`
a // <a><x x="1">1</x><y>2</y></a>

// dispose values observers
a[Symbol.dispose]()
```

Can be used as JSX/[hyperscript](https://ghub.io/hyperscript):

```js
/* jsx h */
const a2 = <a>{ rxSubject } - { asyncIterable } - { promise }</a>
```

### spect/v

_`ref = v( init? )`_

Takes an _`init`_ value and returns a reactive mutable _`ref`_ object. The _`ref`_ object has `.value` property that points to the inner value. It also extends _Observable_/_AsyncIterable_ interface, enabling subscription to changes.

```js
import v from 'spect/v'

// create value ref
let count = v(0)
count.value // 0

// subscribe to value changes
count.subscribe(value => {
  console.log(value)
  return () => console.log('teardown', value)
})

count.value = 1
// ... "1"

count.value = 2
// ... "teardown 1"
// "2"


// create mapped value ref
let double = v(count, value => value * 2)
double.value // 4

count.value = 3
double.value // 6


// create ref from multiple reactive values
let sum = v([count, double], ([count, double]) => count + double)

for await (const value of sum) console.log(value)


// create from initializer
let arrRef = v(() => [1,2,3]), objRef = v(() => ({})), fnRef = v(() => () => {})


// dispose reference, disconnect listeners
sum[Symbol.dispose]()
```


## Examples

### Hello World

```html
<div class="user">Loading...</div>

<script type="module">
  import { $, h, v } from 'spect'

  $('.user', async el => {
    // create user state
    const user = v({ name: 'guest' })

    // render element content, map user state
    h`<${el}>Hello, ${ v(user, u => u.name) }!</>`

    // load data & set user
    user.value = (await fetch('/user')).json()
  })
</script>
```

### Timer

```html
<time id="timer"></time>

<script type="module">
  import { $, v, h } from 'spect'

  $('#timer', timer => {
    const count = v(0), id = setInterval(() => count.value++, 1000)
    h`<${timer}>${ count }</>`
    return () => clearInterval(id)
  })
</script>
```

### Counter

```html
<output id="count">0</output>
<button id="inc">+</button><button id="dec">-</button>

<script type="module">
  import { $, h, v } from 'spect'

  const count = v(0)
  $('#count', el => count.subscribe(c => el.value = c))
  $('#inc', el => el.onclick = e => count.value++)
  $('#dec', el => el.onclick = e => count.value--)
</script>
```

### Todo list

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
  import { $, h, v } from 'spect'

  const todos = v([])
  $('.todo-list', el => h`<${el}>${
    v(todos, items =>
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

### Form validator

<!-- TODO: more meaningful validator -->
```html
<form></form>

<script type="module">
  import { $, h, v } from 'spect'

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

### Prompt

```html
<script>
import {v,h} from 'spect'

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


[See all examples](examples).


## R&D

Sources of inspiration / analysis:

* **$**: [fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), [pure-js](https://pure-js.com/) libraries and others.
* **h**: [lit-html](https://ghub.io/lit-html), [htm](https://ghub.io/htm), [htl](https://ghub.io/htl), [hyperscript](https://ghub.io/hyperscript), [incremental-dom](https://ghub.io/incremental-dom), [snabbdom](https://ghub.io/snabbdom), [nanomorph](https://ghub.io/nanomorph), [uhtml](https://ghub.io/uhtml) and others.
* **v**: [knockout/observable](https://github.com/knockout/tko/issues/22), [mobx/observable](https://mobx.js.org/api.html), [rxjs](https://ghub.io/rxjs), [observable](https://ghub.io/observable), [react hooks](https://ghub.io/unihooks), [observable proposal](https://github.com/tc39/proposal-observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant), [iron](https://github.com/ironjs/iron), [icaro](https://ghub.io/icaro), [introspected](https://ghub.io/introspected), [augmentor](https://ghub.io/augmentor) and others.

Spect has long story of research, at v13.0 it had repository reset. See [changelog](./changelog.md).

## Related

* [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components.
* [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc).

## License

MIT

<p align="center">ॐ</p>

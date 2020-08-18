<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<p align="center"><h1 align="center">spect</h1></p>
<p align="center">
  Reactive aspect-oriented web-framework.<br/>
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

_Spect_ is reactive [_aspect-oriented_](https://en.wikipedia.org/wiki/Aspect-oriented_programming) web framework providing compact UI code and efficient DOM manipulations with 3 canonical functions − _**$**_, _**h**_ and _**v**_. For the better DX.
<!--, successors of [_jquery_](https://ghub.io/jquery), [_hyperscript_](https://ghub.io/hyperscript) and [_observable_](https://www.npmjs.com/package/observable). -->

:gem: **Separation of cross-cutting concerns** with aspects in CSS-like style.

:deciduous_tree: **Native first** − semantic clean tree, vanilla js.

:calling: Organic **progressive enhancement**.

:baby_chick: **Low entry barrier**.

:dizzy: **0** bundling, **0** server, **0** boilerplate.

:shipit: **Low-profile** − can be used as utility.

:golf: Good **performance / size** balance.


## Installation

### A. Directly as a module:

```html
<script type="module">
import { $, h, v } from 'https://unpkg.com/spect?module'
</script>
```

Available from CDN: [unpkg](https://unpkg.com/spect?module), [pika](https://cdn.pika.dev/spect).

### B. As dependency from npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import { $, h, v } from 'spect'
```

_Spect_ plays well with [snowpack](https://www.snowpack.dev/), but any other bundler will do.


## API

### $

> $( scope=document , selector , aspect? )

Selector observer. Triggers `aspect` callback for elements in `scope` matching the `selector`. Returns live collection of matched elements.

```js
import { $, v, h } from 'spect'

let foos = $('.foo', el => {
  console.log('active')
  return () => console.log('inactive')
})

let foo = h`<div.foo/>`
document.body.append(foo)
// ... "active"

foo.remove()
// ... "inactive"

// dispose
foos[Symbol.dispose]()
```

### h

> el = h\`...content\`

[Hyperscript](https://ghub.io/hyperscript) with [HTM](https://ghub.io/htm) / JSX syntax and _Observables_ / _AsyncIterables_ / _Promise_ support.

```js
import { h, v } from 'spect'

const text = v('foo')

// create <baz>
const foo = h`<a>${ text }</a>`
foo // <a>foo</a>

// update content
text('bar')
foo // <a>bar</a>

// fragment
const frag = h`<a>1</a><a>2</a>`

// hydrate
h`<${foo} ...${props}>${ children }</>`

// observables
h`<a>${ rxSubject } - ${ asyncIterable } - ${ promise }</a>`

/* jsx h */
const bar = <a>{ text }</a>

// dispose
bar[Symbol.dispose]()
```

### v

> value = v( init? )

Stateful [_Observable_](https://ghub.io/tc39/proposal-observable). Simple reactive value.

```js
import { v } from 'spect'

let v1 = v(0)

// get
v1() // 0

// set
v1(1)

// subscribe
v1.subscribe(value => {
  console.log(value)
  return () => console.log('teardown', value)
})

// transform
let v2 = v1.map(value => value * 2)
v2() // 2

// initialize
let v3 = v(() => 3)
v3() // 3

// set with fn
v3(v => v + 1)
v3() // 4

// from multiple values
let v4 = v(v3, v2).map((v3, v2) => v3 + v2)

// async iterator
for await (const value of v4) console.log(value)

// dispose
v4[Symbol.dispose]()
```


## Examples

### Hello World

```html
<div class="user">Loading...</div>

<script type="module">
  import { $, h, v } from 'spect'

  $('.user', async el => {
    // create user state
    const user = v({})

    // render element content, map user state
    h`<${el}>Hello, ${ user.map(u => u.name || 'guest') }!</>`

    // load data & set user
    user((await fetch('/user')).json())
  })
</script>
```

### Timer

```html
<time id="timer"></time>

<script type="module">
  import { $, v, h } from 'spect'

  $('#timer', timer => {
    const count = v(0),
      id = setInterval(() => count(c => c + 1), 1000)
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
  $('#inc', el => el.onclick = e => count(c => c+1))
  $('#dec', el => el.onclick = e => count(c => c-1))
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
  $('.todo-list', el => h`<${el}>${ todos.map(items =>
    items.map(item => h`<li>${ item.text }</li>`)
  ) }</>`)
  $('.todo-form', form => form.addEventListener('submit', e => {
    e.preventDefault()
    if (!form.checkValidity()) return

    // push data, update state
    todos().push({ text: form.text.value })
    todos(todos())

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

  const isValidEmail = s => /.+@.+\..+/i.test(s);
  $('form', form => {
    const valid = v(false)
    h`<${form}>
      <label for="email">Please enter an email address:</label>
      <input#email onchange=${ e => valid(isValidEmail(e.target.value)) }/>
      The address is ${ valid.map(b => b ? "valid" : "invalid") }
    </>`
  })
</script>
```

<!--
### Dialog

```html
``` -->

[See all examples](examples).

<!--
_Spect_ doesn't make any guess about storage, actions, renderer or tooling setup and can be used with different flavors.

#### Vanilla

```js
import { $ } from 'spect'

// touched inputs
$('input', el => el.addEventListener('focus', e => el.classList.add('touched')))
```

#### Microfrontends

Pending...

#### Aspect-Oriented DOM

Pending...

-->


## R&D

Sources of inspiration / analysis:

* **$**: [fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) libraries and others.
* **h**: [lit-html](https://ghub.io/lit-html), [htm](https://ghub.io/htm), [htl](https://ghub.io/htl), [hyperscript](https://ghub.io/hyperscript), [incremental-dom](https://ghub.io/incremental-dom), [snabbdom](https://ghub.io/snabbdom), [nanomorph](https://ghub.io/nanomorph), [uhtml](https://ghub.io/uhtml) and others.
* **v**: [rxjs](https://ghub.io/rxjs), [observable](https://ghub.io/observable), [react hooks](https://ghub.io/unihooks), [observable proposal](https://github.com/tc39/proposal-observable), [observ](https://ghub.io/observ), [mutant](https://ghub.io/mutant), [iron](https://github.com/ironjs/iron), [icaro](https://ghub.io/icaro), [introspected](https://ghub.io/introspected), [augmentor](https://ghub.io/augmentor) and others.

Spect has long story of research, at v13.0 it had repository reset. See [changelog](./changelog.md).

## Related

* [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components.
* [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc).

## License

MIT

<p align="center">ॐ</p>

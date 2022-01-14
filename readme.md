<!--
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>
-->

# <sub><img alt="subscript" src="./logo2.svg" height=30 /></sub> spect   <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a> <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a> <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>

> DOM aspects: pieces of logic declared with CSS rules.

#### _`spect( container=document , selector , handler? )`_

Observe _`selector`_ within _`container`_, call `handler` when matching elements found.<br/>
Handler can return a teardown function, called for unmatched elements.<br/>
Returns live collection of elements _SelectorCollection_.

```js
import spect from './spect.js'

let foos = spect('.foo', el => {
  console.log('active')
  return () => console.log('inactive') // teardown
})

let foo = document.createElement('div')
foo.className = 'foo'
document.body.append(foo)
// ... "active"

foo.remove()
// ... "inactive"

// SelectorCollection
foos[idx]                                     // extends Array
foos.has(el), foos.add(el), foos.delete(el)   // implements Set
foos.item(idx), foos.namedItem(elementId)     // implements HTMLCollection
foos.subscribe(fn)                            // Observable
foos.dispose()                                // destroy selector observer / unsubscribe
```

## Examples

<details><summary>Hello World</summary>

```html
<div class="user">{{ user.name || "Loading..." }}</div>

<script type="module">
  import spect from './spect.js'
  import templize from './templize.js'

  // initialize template
  spect('.user', async el => templize(el, {
    user: (await fetch('/user')).json() // value is available when resolved
  }))
</script>
```
</details>

<details><summary>Timer</summary>

```html
<time id="timer">{{ count }}</time>

<script type="module">
  import v from './vref.js'
  import spect from './spect.js'
  import templize from './templize.js'

  spect('#timer', timer => {
    const count = v(0), id = setInterval(() => count.value++, 1000)
    templize(timer, { count })
    return () => clearInterval(id)
  })
</script>
```
</details>
    
<details><summary>Counter</summary>
  
```html
<output id="count">{{ count }}</output>
<button id="inc">+</button>
<button id="dec">-</button>

<script type="module">
  import spect from './spect.js'
  import v from './vref.js'
  import templize from './templize.js'

  const count = v(0)
  spect('#count', el => templize(el, { count }))
  spect('#inc', el => el.onclick = e => count.value++)
  spect('#dec', el => el.onclick = e => count.value--)
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
  <ul class="todo-list">{{ todos }}<ul>
</form>

<script type="module">
  import spect from './spect.js'
  import v from './vref.js'
  import h from './hyperf.js'
  import tpl from './templize.js'

  const todos = v([])

  spect('.todo-list', el => tpl(el, {
    todos: todos.map(item => h`<li>${ item.text }</li>`)
  }))

  spect('.todo-form', form => form.addEventListener('submit', e => {
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
<form id="email-form"></form>

<script type="module">
  import spect from './spect.js'
  import h from './hyperf.js'
  import v from './vref.js'

  const isValidEmail = s => /.+@.+\..+/i.test(s)

  spect('#email-form', form => {
    const valid = v(false)
    h`<${form}>
      <label for="email">Please enter an email address:</label>
      <input#email onchange=${ e => valid.value = isValidEmail(e.target.value) }/>
      The address is ${ v(valid).map(b => b ? "valid" : "invalid") }
    </>`
  })
</script>
```
</details>

<details><summary>Prompt</summary>

```html
<script>
import h from './hyperf.js'
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

<!-- [See all examples](examples). -->

## Related

* [vref](https://github.com/spectjs/vref) − value container with observable interface.
* [templize](https://github.com/spectjs/templize) − DOM element template parts.
* [hyperf](https://github.com/spectjs/hyperf) − Hypertext fragment builder with reactivity.
* [subscribable-things](https://github.com/chrisguttandin/subscribable-things) − collection of observables for different browser APIs - perfect match with spect.
* [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components.
<!-- * [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc). -->


## Refs

[fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), [qso](https://www.npmjs.com/package/qso), [pure-js](https://pure-js.com/), [element-observer](https://github.com/WebReflection/element-observer).

<p align="center">ॐ</p>

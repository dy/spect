<!--
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>
-->

# <sub><img alt="subscript" src="./logo2.svg" height=30 /></sub> spect   <a href="https://github.com/spectjs/spect/actions/workflows/test.yml"><img src="https://github.com/spectjs/spect/actions/workflows/test.yml/badge.svg"/></a> <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a> <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>

> DOM aspects: pieces of logic declared with CSS rules.

#### _`spect( [ container=document, ] selector, handler? )`_

Observe _`selector`_ within _`container`_, call `handler` when matching elements found.<br/>
Handler can return a teardown function, called for unmatched elements.<br/>
Returns live collection of elements _SelectorCollection_.

```js
import spect from 'spect'

const foos = spect('.foo', el => {
  console.log('active')
  return () => console.log('inactive') // teardown
})

const foo = document.createElement('div')
foo.className = 'foo'
document.body.append(foo)
// ... "active"

foo.remove()
// ... "inactive"
```

### SelectorCollection

Extends _Array_, implements _Set_, _HTMLCollection_ methods, and provides _Observable_, _AsyncIterable_, _Disposable_ interfaces.

```js
foos[idx]                                     // Array
foos.has(el), foos.add(el), foos.delete(el)   // Set
foos.item(idx), foos.namedItem(elementId)     // HTMLCollection
foos.subscribe(fn)                            // Observable
foos.dispose()                                // destroy selector observer / unsubscribe
```

### Technique

It combines selector parts indexing from [selector-observer](https://github.com/josh/selector-observer) for simple queries and animation events [insertionQuery](https://github.com/naugtur/insertionQuery) for complex selectors.

## Examples

<details><summary>Hello World</summary>

```html
<div class="user">{{ user.name || "Loading..." }}</div>

<script type="module">
  import spect from 'spect'
  import templize from 'templize'

  // initialize template
  spect('.user', async el => templize(el, {
    user: (await fetch('/user')).json() // value is available when resolved
  }))
</script>
```
</details>

<details><summary>Timer</summary>

```html
<time class="timer">{{ count }}</time>
<time class="timer">{{ count }}</time>

<script type="module">
  import v from 'value-ref'
  import spect from 'spect'
  import templize from 'templize'

  spect('.timer', timer => {
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
<button id="inc" onclick="{{ inc }}">+</button>
<button id="dec" onclick="{{ dec }}">-</button>

<script type="module">
  import spect from 'spect'
  import v from 'value-ref'
  import templize from 'templize'

  const count = v(0)
  spect('#count', el => templize(el, { count }))

  // bind events via HTML template
  spect('#inc', el => templize(el, { inc: () => count.value++ }))
  spect('#dec', el => templize(el, { dec: () => count.value-- }))
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
  import spect from 'spect'
  import v from 'value-ref'
  import h from 'hyperf'
  import tpl from 'templize'

  // FIXME: use specially designed reactive list for optimized updates
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
  import spect from 'spect'
  import h from 'hyperf'
  import v from 'value-ref'

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
<dialog class="dialog" open={{showPrompt}}>
  Proceed?
  <menu>
    <button onclick={{cancel}}>Cancel</button>
    <button onclick={{confirm}}>Confirm</button>
  </menu>
</dialog>

<script>
import v from 'value-ref'
import spect from 'spect'

spect('.dialog', el => {
  const showPrompt = v(false), proceed = v(false)
  templize(el, {
    showPrompt, proceed,
    cancel() {showPrompt.value = proceed.value = false;},
    confirm() {showPrompt.value = false; proceed.value = true;}
  })
})
</script>
```
</details>

<!-- [See all examples](examples). -->

## Best Buddies

* [value-ref](https://github.com/spectjs/value-ref) − value container with observable interface. Indispensible for reactive data.
* [templize](https://github.com/spectjs/templize) − DOM buddy - hooks up reactive values to element template parts.
* [hyperf](https://github.com/spectjs/hyperf) − builds HTML fragments with reactive fields.
* [subscribable-things](https://github.com/chrisguttandin/subscribable-things) − collection of observables for different browser APIs.
<!-- * [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components. -->
<!-- * [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc). -->


## Refs

[fast-on-load](https://ghub.io/fast-on-load), [selector-set](https://github.com/josh/selector-set), [insertionQuery](https://github.com/naugtur/insertionQuery), [selector-observer](https://github.com/josh/selector-observer), [reuse](https://ghub.io/reuse), [aspect-oriended-programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming), [qso](https://www.npmjs.com/package/qso), [pure-js](https://pure-js.com/), [element-observer](https://github.com/WebReflection/element-observer), [livequery](https://github.com/hazzik/livequery), [selector-listener](https://github.com/csuwildcat/SelectorListener), [mutation-summary](https://github.com/rafaelw/mutation-summary), [rkusa/selector-observer](https://github.com/rkusa/selector-observer).

<p align="center">ॐ</p>

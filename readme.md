<!--
<p align="center">▶ <a href="https://codepen.io/dyv/pen/oNXXZEb" target="_blank"><strong>Run</strong></a></p>
<br/>
-->

# <sub><img alt="subscript" src="./logo2.svg" height=30 /></sub> spect   <a href="https://github.com/spectjs/spect/actions/workflows/test.yml"><img src="https://github.com/spectjs/spect/actions/workflows/test.yml/badge.svg"/></a> <a href="https://bundlephobia.com/result?p=spect"><img alt="npm bundle size" src="https://img.shields.io/bundlephobia/minzip/spect?label=size"></a> <a href="https://npmjs.org/package/spect"><img alt="npm" src="https://img.shields.io/npm/v/spect"></a>

> Observe selectors in DOM.

#### _`spect( container=document, selector, handler? )`_

Observes _`selector`_ in _`container`_, invokes `handler` any time matching elements appear.<br/>
Handler can return a teardown function, called for unmatched elements.<br/>
Returns live collection of elements.

```js
import spect from 'spect';

// assign aspect
const foos = spect('.foo', el => {
  console.log('connected');
  return () => console.log('disconnected');
});

// modify DOM
const foo = document.createElement('div');
foo.className = 'foo';
document.body.append(foo);
// ... "connected"

foo.remove();
// ... "disconnected"
```

#### _`spect(element[s], handler)`_

Listens for connected/disconnected events for the list of elements. (alternative to [fast-on-load](https://www.npmjs.com/package/fast-on-load))

```js
const nodes = [...document.querySelectorAll('.foo'), document.createElement('div')];

// assign listener
spect(nodes, el => {
  console.log("connected");
  return () => console.log("disconnected");
});

document.body.appendChild(nodes.at(-1))
// ... "connected"

nodes.at(-1).remove()
// ... "disconnected"
```

### Live Collection

Spect creates live collection of elements matching the selector. Collection extends Array and implements Set / HTMLColection interfaces.

```js
const foos = spect(`.foo`);

// live collection
foos[idx], foos.at(idx)                       // Array
foos.has(el), foos.add(el), foos.delete(el)   // Set
foos.item(idx), foos.namedItem(elementId)     // HTMLCollection
foos.dispose()                                // destroy selector observer / unsubscribe
```

### Technique

It combines selector parts indexing from [selector-observer](https://github.com/josh/selector-observer) for simple queries and animation events from [insertionQuery](https://github.com/naugtur/insertionQuery) for complex selectors.

Simple selector is id/name/class/tag followed by classes or attrs.

* `#a`, `.x.y`, `[name="e"].x`, `*`, `a-b-c:x` - simple selectors.
* `a b`, `#b .c` - complex selectors.

<!--
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
  import spect from 'spect'
  import templize from 'templize'

  spect('.timer', timer => {
    const params = templize(timer, { count: 0 })
    const id = setInterval(() => params.count++, 1000)
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

  const todos = v([])

  spect('.todo-list', el => tpl(el, {
    todos: v.from(todos, item => h`<li>${ item.text }</li>`)
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

```html
<form id="email-form">
  <label for="email">Please enter an email address:</label>
  <input id="email" onchange={{ validate }}/>
  The address is {{ valid ? "valid" : "invalid" }}
</form>

<script type="module">
  import spect from 'spect'
  import templize from 'templize'

  const isValidEmail = s => /.+@.+\..+/i.test(s)

  spect('#email-form', form => {
    const params = templize(form, {
      valid: false,
      validate: () => params.valid = isValidEmail(e.target.value)
    })
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

[See all examples](examples).
-->

<!--
## Best Buddies

* [value-ref](https://github.com/spectjs/value-ref) − value container with observable interface. Indispensible for reactive data.
* [templize](https://github.com/spectjs/templize) − DOM buddy - hooks up reactive values to template parts.
* [hyperf](https://github.com/spectjs/hyperf) − builds HTML fragments with reactive fields.
* [subscribable-things](https://github.com/chrisguttandin/subscribable-things) − collection of observables for different browser APIs.
-->
<!-- * [element-props](https://github.com/spectjs/element-props) − unified access to element props with observable support. Comes handy for organizing components. -->
<!-- * [strui](https://github.com/spectjs/strui) − collection of UI streams, such as router, storage etc. Comes handy for building complex reactive web-apps (spect, rxjs etc). -->


## Alternatives

[element-behaviors](https://github.com/lume/element-behaviors),
[insertionQuery](https://github.com/naugtur/insertionQuery),
[selector-observer](https://github.com/josh/selector-observer),
[qso](https://www.npmjs.com/package/qso),
[qsa-observer](https://www.npmjs.com/package/qsa-observer),
[element-observer](https://github.com/WebReflection/element-observer),
[livequery](https://github.com/hazzik/livequery),
[selector-listener](https://github.com/csuwildcat/SelectorListener),
[mutation-summary](https://github.com/rafaelw/mutation-summary),
[fast-on-load](https://ghub.io/fast-on-load),
[selector-set](https://github.com/josh/selector-set),
[rkusa/selector-observer](https://github.com/rkusa/selector-observer).

<p align="center"><a href="https://krishnized.com/license/">ॐ</a></p>

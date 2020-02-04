<div align="center"><img src="https://avatars3.githubusercontent.com/u/53097200?s=200&v=4" width=108 /></div>
<h1 align="center">
  spect
</h1>
<p align="center">
  <em>Spect</em> is a tool for creating DOM <a href="https://en.wikipedia.org/wiki/Aspect-oriented_programming">aspects</a>.<br/>
  Rules, similar to CSS, where for every rule there is corresponding <em>aspect</em> function.
</p>
<p align="center">
  <img src="https://img.shields.io/badge/stability-experimental-yellow"/>
  <a href="https://travis-ci.org/spectjs/spect"><img src="https://travis-ci.org/spectjs/spect.svg?branch=master"/></a>
</p>

<p align="center"><img src="/timer.png" width="540"/></p>

## Installation

#### From npm:

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

#### Or as ES module:

```html
<script type="module">
import spect from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```

## Usage

_Spect_ makes no guess about at store, actions, rendering implementation or tooling setup, so can be used with different flavors, from vanilla to sugared frameworks.

#### Vanilla + Observable

<!--
```js
import spect from 'spect'
import { render, html } from 'lit-html'

spect('.timer', el => {
  let count = 0
  let id = setInterval(() => {
    render(html`Seconds: ${count++}`, el)
  }, 1000)
  return () => clearInterval(id)
})
```
-->

```html
<!DOCTYPE html>
<html lang="en">
  <title>spect demo</title>

  <div id="todo-list">
    <header name="ToDo's (${page})" />
    <ul>
      ${todos.map(todo => html`
        <li>${todo}</li>
      `)}
    </ul>
    <button id="add-todo">Add Todo</button>
    <footer>footer content here</footer>
  </div>

  <script type="module">
    import $ from 'https://unpkg.com/spect@latest'

    const state = { todos: [] }

    const addTodo() {
      state.todos.push(`Item ${todos.length}`) }
    }

    $('#todo-list", el => {

    })

    $('#add-todo", el => el.addEventListener('click', e => {
      addTodo()
    }))

    $('header', el => {
      el.innerHTML = `<h1>ToDo's (${ el.getAttribute('name')}) List</h1>`
    })
  </script>
</html>
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


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


#### Aspect-Oriented DOM


## API

### unspect = spect( selector | target, callback, context?)

Assigns a `callback` function to `selector` or direct element. Returned `unspect` function removes assigned `callback`. The return of `callback` is destructor callback, called when element is unmounted.

* `selector` must be valid CSS selector.
* `target` can be _dict_ of selectors, an _element_ or _elements list_.
* `callback` is a function `target => ondestroy` or an array of functions.
* `context` is optional element to assign mutation observer to, can be helpful for perf optimization, but benchmark shows that the worst case mutation observer contributes ≤ 5% to app slowdown.

## See also

* [selector-observer](https://ghub.io/selector-observer) − same idea with object-based API.
* [augmentor](https://ghub.io/augmentor) − turn callbacks into react components.
* [unihooks](https://ghub.io/unihooks) − cross-framework hooks collection.

<p align="right">HK</p>

# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ is a tool for building web-apps in [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) fashion. It defines a set of rules for web-page, similar to CSS, where for every rule there is corresponding _aspect_.


## Installation

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

<details><summary><strong>Or as ES module</strong></summary><br/>

```html
<script type="module">
import spect from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```
</details>

<!--
#### C. As standalone bundle

```html
<script src="https://unpkg.com/spect/dist-umd/index.bundled.js"></script>
<script>
  let spect = window.spect

  // ...UI code
</script>
```
-->

<!--
## Usage

Spect assigns reactive functions with hooks to selectors or elements.

```js
import spect, { useEffect } from 'spect'
import { useAttribute, useRoute, useStore } from 'unihooks'
import { html, render } from 'lit-html'

// main app aspect
spect('#app', el => {
  let [{ id }] = useRoute('users/:id')
  let [user, setUser] = useStore('user', { id: null, name: null, })
  let [loading, setLoading] = useAttribute(el, 'loading')

  useEffect(() => {
    setLoading(true)
    setUser(await fetch(`user/${id}`))
    setLoading(false)
  }, [id])

  render(loading ? 'Loading...' : html`Hello, ${ user.name }!`, el)
}

// preloader aspect - displays preloader when `loading` attribute is set
spect('[loading]', el => {
  let preloader = document.createElement('progress')
  preloader.classList.add('circular-progress')
  el.replaceWith(preloader)
  return () => preloader.replaceWith(el)
})
```
-->


## Concepts

1. _Aspect_ is reactive function with enabled react-like hooks.
2. _Aspect_ is assigned to a target an element or an object, allowing multiple aspects and declarative code.
3. _Aspect_ addresses a side of component logic. That way [_SoC_](https://en.wikipedia.org/wiki/Separation_of_concerns) and _progressive enhancement_ are achieved without HOCs, contexts, composers etc.
4. Rendering is a side-effect, not main effect. That allows render-less aspects and any rendering engine, such as [lit-html](https://ghub.io/lit-html), [htl](https://ghub.io/htl), [morphdom](https://ghub.io/morphdom) etc.

<!--
Components?
-->

## Getting started
<!--
🎬 Let's build [react examples](https://reactjs.org/).

### A Simple Aspect
-->
<!--
This example assigns handler to `#hello-example` element and observes its `name` property, rerendering content.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import spect from 'spect'
import { render, html } from 'lit-html'

spect('#hello-example', el => {
  render(html`
    <div class="message">
      Hello, ${ el.attributes.name.value }!
    </div>
  `, el)
})
```
-->

Let's build simple timer example.

```js
import spect, { useEffect, useState } from 'spect'
import { render, html } from 'lit-html'

// for every #timer-example element
spect('#timer-example', async el => {
  let [count, setCount] = useState(0)

  useEffect(() => {
    let i = setInterval(() => {
      setCount(count => ++count)
    }, 1000)
    return () => clearInterval(i)
  }, [])

  render(html`Seconds: ${seconds}`, el)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>

<!--
### An Application

Selector streams allow easily assign aspects to elements.

```js
import spect from 'spect'

spect('#todos-example', el => {
  let state = { items: [], text: '' }

  // run effect by submit event
  on(el, 'submit', e => {
    e.preventDefault()

    if (!state.text.length) return

    state.items = [...state.items, { text: state.text, id: Date.now() }]
    state.text = ''
  })

  // rerender html when state changes
  prop(state, 'items', items => {
    html`<${el}>
    <h3>TODO</h3>
    <main#todo-list items=${ items }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <br/>
      <input#new-todo onchange=${ e => state.text = e.target.value}/>
      <button>
        Add #${ items.length + 1}
      </button>
    </form>
  </>`
  })
})

spect('#todo-list', el => {
  prop(el, 'items', items => html`<${el}><ul>${items.map(item => html`<li>${item.text}</li>`)}</ul></>`)
})

```

<p align='right'><a href="https://codesandbox.io/s/an-application-uiv4v">Open in sandbox</a></p>


### A Component Using External Plugins

The _html_ syntax is extension of [htm](https://ghub.io/htm), enabling rendering / creating / patching real DOM.
Can be replaced with [lit-html](https://ghub.io/lit-html).

```js
// index.js
import spect from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
spect('#markdown-example', el => html`<${el}><${MarkdownEditor} content='Hello, **world**!'/></el>`)
```

```js
// editor.js
import { prop, state, html } from 'spect'
import { Remarkable } from 'remarkable'

function MarkdownEditor({ element, content }) {
  let state = { value: content }

  prop(state, 'value', (value) => {
    html`<${element}.markdown-editor>
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content onchange=${e => state.value = e.target.value }>${ value }</textarea>

    <h3>Output</h3>
    <div.content innerHTML=${ getRawMarkup(value)} />
    </>`
  })
}

let getRawMarkup = content => {
  const md = new Remarkable();
  return md.render(content);
}
```

<p align='right'><a href="https://codesandbox.io/s/a-component-tnwdm">Open in sandbox</a></p>

-->

<!--
### More examples

* [Popup-info component from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):
-->

## Use-cases

<details>
<summary><strong>Inject SVG elements</strong></summary><br/>

Convert `<img src="*.svg"/>` to `<svg>...</svg>`:

```js
$('img[src$=".svg"]', async el => {
  let resp = await fetch(el.getAttribute('src'))
  let parser = new DOMParser()
  let text = await resp.text()
  let root = parser.parseFromString(text, "image/svg+xml")
  el.replaceWith(root.querySelector('svg'))
})
```

See [svg-inject](https://ghub.io/svg-inject).
</details>


<details>
<summary><strong>CSS atoms</strong></summary><br/>

CSS tachyons / modifiers can be organized in fashion:

```js
const UNIT = 8

// <div m=4 />
$('[m]', el => {
  let margin = parseInt(el.getAttribute('m'))
  el.style.margin = `${margin * UNIT}px`
})
$('[p]', el => {
  let padding = parseInt(el.getAttribute('p'))
  el.style.padding = `${padding * UNIT}px`
})

// ...
```

See [tachyons](https://ghub.io/tachyons), [atomic css](https://ghub.io/atomic), [tailwind](https://ghub.io/tailwind), [ui-box](https://ghub.io/ui-box) etc.
</details>

<details><summary><strong>jQuery plugins</strong></summary><br/>

JQuery plugins can be robustly assigned to elements as:

```js
import $ from 'jquery'
import spect from 'spect'
import 'some-jquery-plugin'

spect('.target', el => {
  let plugin = $(el).somePlugin()
  return () => {
    plugin.destroy()
  }
})
```
</details>

<details><summary><strong>i18n</strong></summary>

I18n can be organized as an aspect with a separate module:

```js
import spect from 'spect'
import t from 'i18n-lib'

spect('.i18n', el => {
  let initial = el.textContent
  el.textContent = t(el.textContent)
  return () => el.textContent = initial
})
```
</details>


<details><summary><strong>Actions in HTML</strong></summary><br/>

Spect allows wiring up app actions directly from HTML:

```html
<button data-action="login"></button>

<script type="module">
import spect from 'spect'

let actions = {
  login() {
    // ...
  },
  logout() {
    // ...
  }
}

spect('[data-action]', el => {
  let action = el.dataset.action
  el.onclick = actions[action]
})
</script>
```

</details>

<details><summary><strong>Tooltips</strong></summary><br/>

Custom tooltips can be organized as

```js
import tippy from 'tippy'
import spect from 'spect'

spect('[title]', el => {
  tippy(el, {
    content: el.title
  });
})
```
</details>

<!-- ### Ripple visual effect -->

<!--
<details><summary><strong>Client-side Image Optimization</strong></summary><br/>

As described [here](https://eager.io/blog/three-real-world-use-cases-for-mutation-observer/), it is possible to swap image src before it started loading, to load optimized for current device version of it.

</details>
-->

<!-- ### Insert links dynamically in contenteditable -->


## API

### unspect = spect( target , aspect )

* `target` is _selector_, _element_, _elements list_ or an _object_.
* `aspect` is a function `target => destructor`.

Assigns aspect function to elements matching selector or direct elements. Returned `unspect` function removes created aspect, cleaning up all `useEffect` calls.


<!--
* `createAction`, `useAction` describes some page/app action, available in the app.
* `createStore`, `useStore` aspect defines store(model), identifiable by some target or id.
* `event` - describes aspect of interaction, from event source to side-effects.
-->


## See also

* [unihooks](https://ghub.io) − cross-framework hooks collection.

<!--
## Changelog

Version | Changes
---|---
12.0.0 | Own hooks
11.0.0 | Aspects-only observer.
10.0.0 | Web-streams.
9.0.0 | Effects as asynchronous iterators.
8.0.0 | Atomize: split core $ to multiple effects.
7.0.0 | Deatomize; single core approach; ref-based approach.
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).
-->

<p align="right">HK</p>

# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

_Spect_ provides minimal abstraction to build web-apps in [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) fashion.

<!--
<details>
<summary>B. As ES module</summary>

```html
<script type="module">
import { use, fx, on } from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```
</details>

<details>
<summary>C. As standalone bundle</summary>

```html
<script src="https://unpkg.com/spect/dist-umd/index.bundled.js"></script>
<script>
  let { fx, on } = window.spect

  // ...UI code
</script>
```
</details>
-->

[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

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

  render(html`
    <p>${
      !loading ? `Hello, ${ user.name }!`
      : `Thanks for patience...`
    }</p>
  `, el)
}

// preloader aspect
spect('[loading]', el => {
  let content = useMemo(() => [...el.childNodes]),
      progress = html`<progress class="progress-circle" />`
  let [loading] = useAttribute(el, 'loading')

  render(loading ? content : progress, el)
})
```

## 🏛️ Concepts

* Aspect is reactive function with react-compatible data/effect hooks, see [unihooks](https://ghub.io/unihooks).
* Aspects are assigned to DOM in CSS fashion, allowing multiple aspects and declarative sheets.
* Aspect defines behavior, or component logic - that way _separation of concerns_ and _progressive enhancement_ are achievable without wrappers, HOCs, contexts etc.
* Rendering is a side-effect, not the main effect. That allows render-less aspect, and enables any rendering lib as a base, eg. [lit-html](https://ghub.io/lit-html), [htl](https://ghub.io/htl) or [morphdom](https://ghub.io/morphdom).
* Easter Egg: _spect_ works with any installed hooks framework - [react](https://ghub.io/react), [preact](https://ghub.io/preact), [haunted](https://ghub.io/haunted) etc., with default fallback to [augmentor](https://ghub.io/augmentor).

<!--
## Getting started

🎬 Let's build [react examples](https://reactjs.org/).

### A Simple Selector Stream

This example assigns handler to `#hello-example` element and observes its `name` property, rerendering content.

```html
<div id="hello-example" name="Cyril"></div>

<script type="module">
import spect from 'spect'

spect('#hello-example', props => {
  return <this>
    <div class="message">
      Hello, { props.name }!
    </div>
  </this>
})
```

This is example of simple timer: it handles `connected` and `disconnected` event streams, as well as runs side-effect via `fx`, that is triggered whenever any input stream (`prop`) emits new value.

```js
import spect from 'spect'

// for every #timer-example element
spect('#timer-example', async el => {
  let state = { seconds: 0 }

  // start timer when connected, end when disconnected
  on(el, 'connected', e => {
    let i = setInterval(() => {
      state.seconds++
    }, 1000)

    on(el, 'disconnected', () => clearInterval(i))
  })

  // rerender when seconds change
  fx(prop(state, 'seconds'), seconds => html`<${el}>Seconds: ${seconds}</>`)
})
```

<p align='right'><a href="https://codesandbox.io/s/a-stateful-aspect-9pbji">Open in sandbox</a></p>


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



## API

### `unspect = spect( selector | element[s], aspectFn )`

Assign aspect to elements matching selector or direct elements. Returned `unspect` function destroys created aspect, cleaning up all `useEffect` calls.


<!--
* `createAction`, `useAction` describes some page/app action, available in the app.
* `createStore`, `useStore` aspect defines store(model), identifiable by some target or id.
* `event` - describes aspect of interaction, from event source to side-effects.
-->




## Changelog

Version | Changes
---|---
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

<p align="right">HK</p>

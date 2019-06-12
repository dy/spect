# Spect

`Spect` brings principles of [Aspect-Oriented Programming](https://en.wikipedia.org/wiki/Aspect-oriented_programming) with modern frontend practices, like virtual-DOM, hooks and web-components, keeping the simplicity of vanilla js and jQuery flavor.

Spect introduces the concept of _aspect_ [- a function with hooks/effects, accompanying any DOM _Node_]. Such DOM-aspects can augment plain elements with additional behavior, such as:

* visual effects (ripple, appearance, parallax, animations etc.)
* style properties (ui-box, tacjypns, layout polyfills etc.)
* a11y, l10n
* document side-effects (meta, header, dataschema)
* business-logic (authentication, authorization, accounting)
* connecting to store / providing data
* logging, context, etc.
* sound
* text formatting, typography
* additional rendering (portals)
* etc.

* :gem:

## Getting started

[TODO: highly demonstrative generic example ]

### Examples

[TODO: remount]
[TODO: react-use]
[TODO: context]
[TODO: ui-box]

[TODO: 2-seconds connect via unpackage module]
[TODO: connect as direct dependency]
[TODO: another good example, not too specific]

[TODO: TODO-app]()
[TODO: Forms]()
[TODO: Sound synthesiser as an aspect]()


```js
import spect from "https://unpkg.com/spect/dom"
import { fx, attr } from "https://unpkg.com/spect/fx"

// declare dom-aspect
spect('.app', el => {
  // register attributes listeners - trigger renderer any time an attribute changes
  let [x, setX] = attr('x')

  let result = fx(() => {
    // called when deps change
  }, deps)

  // fx can be a generator
  let result = gen(async function * () {
    yield Symbol('pending')
    yield Symbol('loading')
    let data = await load()

  })

  // register an event - automatically removed when element is unmounted
  on('click', e => {

  })

  // make sure htm softly exists in the element (doesn't remove the rest)
  htm`
    <div is=${RegisteredElement} use=${[Provider, Auth, Persistor]}></div>
  `
})
```

[Material-components](https://github.com/material-components/material-components-web) example:

```html
<link href="https://unpkg.com/@material/ripple/dist/mdc-ripple.css" rel="stylesheet">
<script type="module">
  import spect from "https://unpkg.com/spect"
  import {MDCRipple} from 'https://unpkg.com/@material/ripple';

  // register ripple effect for all buttons on the page
  spect('button', el => {
    let ripple = new MDCRipple(el)
    el.classNames.add('mdc-ripple')

    return ripple.destroy
  }, [])
</script>

<button>Ripple</button>
```

Simulated canvas layers via DOM:

```js
spect('canvas.plot', canvas => raf(
  function render () {
    let ctx = canvas.getContext('2d')

    // clear canvas
    ctx.clearRect(0,0, canvas.width, canvas.height)

    // rerender all layers
    [...el.children].forEach(layer => {
      if (!(layer instanceOf CanvasLayer)) CustomElements.upgrade(layer, 'canvas-layer')

      layer.draw()
    })

    raf(render)
  }
  )
)
```

### Non-DOM aspects

Spect allows experimental non-dom aspects support. For that purpose `spect` entry should be used.

```js
import spect from 'spect'

function aspect (obj) {
  // ...non-dom fx work
  dprop('a.b.c')
  on('evt', callback)
}

// we have to add that trait to some object
spect(obj, aspect)

// this way we can attach "sagas" to some store
spect(store, state => {
  on('specialEvent', () => {
    someAction
  })

  emit('event', () => {})
})

```

```js
function App(el) {
  // location side-effect
  let [path, setPath] = location()

  // window.title side-effect
  let [title, setTitle] = title()

  // DOM render
  htm`
    <main react=${App}>
    </main>
    <aside mount=${}
  `, el)
}
```



```html
<style>
@import "//unpkg.com/@material/textfield/mdc-text-field"
</style>

<script>
import mod, { htm, css, fx } from '//unpkg.com/@mod/core'

import { MDCRipple } from '//unpkg.com/@material/ripple'
import { MDCTextField } from `//unpkg.com/@material/textfield`

// register ripple effect for all elements with .mdc-ripple class on the page
// ( it raises a question of internal redundancy instantly that needs covering )
mod('.mdc-ripple', MDCRipple)

// create textField custom element based on material ui (following the docs)
let TextField = mod(el => {
  htm`<div class="mdc-text-field">
        <input type="text" id="my-text-field" class="mdc-text-field__input">
        <label class="mdc-floating-label" for="my-text-field">Label</label>
        <div class="mdc-line-ripple"></div>
      </div>`

  el.textField = new MDCTextField(el)
})
customElements.define('mdc-text-field', TextField, {extends: 'div'})
</script>

<body>
  <aside class="mod-sidebar"/>
  <main class="mod-page">
    <div class="logo mod-route"/>
    <nav class="mod-sticky"/>

      <article>
          <header class="mod-seo" data-seo="json">
            <h1 mod-typography="typo-settings">{page.title}</h1>
            <div mod-share/>
          </header>

          <section is="mod-intro"/>
          <feature><feature/><feature/>

          <footer class="mod-footer"/>
      </article>
    </main>
</body>
```

Effects without specting:

```js
import fx from 'spect/fx'

document.querySelector(el => {
  // effects - applied once (waiting for function.caller proposal)...
})
```




## Effects

* mount
* visible
* state
* attr
* prop
* query
* local
* fx
* on
* remote
* html
* css

### mount

Called when the element is mounted on the DOM. The returned function is called when the element is unmounted.

```js
el => {
  mount(() => {
    // called when element is mounted

    return () => {
      // called when element is unmounted
    }
  })
}
```


### `state`

Same as react `useState`. Provides per-element private state:

```js
function mod (el) {
let [value, set] = state(initialValue)
}
```

### `attr`

Same as `state`, but reads an attribute from the element, as well as registers listeners for the defined attribute. Any time attribute value changes, it triggers rerender.

```js
(el) => {
  let [value, set] = attr('my-attribute-name')
}
```

### `prop`

Similar to `attr` but registers prop listener for the element. Can be used for communication between aspects.

```js
// first aspect
el => {
  let [value, set] = prop('my-prop-name')
}

// second aspect
el => {
  let [value, set] = prop('my-prop-name')
  // value is written by first aspect
}
```

### `query`

Same as `state`, but reflects state value in browser `location.search` as `https://url.com/?param=value`.

```js
(el) => {
  let [value, set] = q('my-query-param-name')
}
```

### `local`

Same as `state`, but persists value in localStorage.

```js
el => {
  let [value, set] = local('my-key')
}
```

### `remote` [pending...]

Same as local, but persists value via remote storage.

### `fx` [unstable...]

Run side-effect function. Similar to react's `useEffect`, with some differences: `fx` can return value; `fx` has no destructor; handler can be async function; handler can be generator.

```js
function mod (el) {
  let [result, pending, error] = fx(handler, deps?)
}
```

### on

Attach event handler to the target element. No need to care about removing listeners - they're removed automatically when component is unmounted.

```js
el => {
  on('evt', handler)

  on('evt1 evt2 evt3', handler)
}
```


### css

CSS effect for an element. Uses virtual-css to apply fast CSS diffs.

```js
el => {
css`
:host {
}
:host .sub-element {
}
`
}
```

## Plugins

* [spect-react]() - render react components in spect.
* [spect-redux]() - use state hooks, connected to redux store.
* [spect-gl]() - enable layers for gl-canvas element.
* [spect-a11y]() - enable a11y props for the element.
* [spect-dataschema]() - provide dataschema props for the element.
* [spect-meta]() - set document meta props.
* [spect-uibox]()
* [spect-use]() - enable multiple aspects, similar to react-use.


### interval

Schedule regular callback.

```js
function mod () {
    interval(() => {}, 50)
}
```

### raf

Schedule rendering in next frame.

### route

Coditionally trigger element by matching route.

### visible

Invoked when element is visible in the screen.

### onhidden

Invoked when element is hidden from the viewport.

### transition

Invoked per-transition.



## Integration with react

Aspects are interoperable with react.

To connect aspect to react, just put aspect into `ref` prop:

```jsx
import Box from 'spect-ui-box'

<App>
<div className="fps-indicator" ref={Box} color="red"/>
</App>
```

The `Box` aspect will enable style attributes for fps-indicator element.

To connect react component to spect, just use normal react render:

```js
import $ from 'spect'
import React from 'react'
import render from 'react-dom'
import App from './App.jsx'

$('.app', el => render(<App {...el.getAttributes()}/>, el)
```

This can also serve as remount:

```js
```

<!--

## Registering aspects, pointcuts

Basic pattern for registering aspects:

```java
aspect Name {
  pointcut name(): proxy fields to observe
  before|after|join point: pointcut {
    advice code
  }
}

So basically when to trigger, what to trigger

```
spect.register(TargetClass, whenToTriggerFx)
```

But that can't easily extend native builtins, that provides own implementation.


Streams:

```js
stream = spect(Stream, function handler (chunk) {
start(() => {
})
data(() => {
})
end(() => {
})
})
```

Objects:

```js
obj = $o(obj, function handler (obj) {
})
```
-->

## Motivation

Aspects aren't something new for DOM, the perfect example of aspect is CSS - instead of stuffing styles inline into elements, styles are separated into a stylesheet "aspect", with selectors defining "pointcuts" and style rules defining "advice". Spect bring this concept back and pushes it one step forward, enabling generic aspects.

In result, this gives graceful solution to existing frontend problems, such as many shallow JSX wrappers (react providers, styling systems, HOCs), portals, component side-effects, tree complexity (see [tweet](https://twitter.com/sindresorhus/status/1089075390327316480)), abandoning CSS/HTML, bundling.

Made for people who love clean elegant code from people who love clean elegant code.


### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila



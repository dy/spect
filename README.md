# Spect

Functional aspects.

Spect is a concept inspired by aspect/subject programming, react hooks and custom elemeents. For any object it creates effects-enabled accompanying function (so-called advice). Effects can be thought of as react hooks with better API design.
DOM-aspects can augment elements with additional behavior, from effects (like ripple, fade-in, parallax or animation) to business-logic (authentication, authorization, accounting, logging, etc).


## Gems

* effectful functions, not bound to DOM
* cached state machine
* soft dom diff


* Respects semantic HTML: familiar, enforces good practice, provokes semantic thinking
* Provides multiframework glue: mods take internal rendering result of the other framework
* Modifiers from the BEM: modifier is still element, but allows blending with other modifiers
* Self-deployable JSX
* Embrace react hooks simplicity
* Particles of behavior
* Natural blend of html/js: behavioral wrapper components merge into one semantic tag
* Blends in JSX, HTM etc or templates.
* Like attributes with additional behavior
* Mod is h-compatible function, each mod receives an element and props `(el, props) => {}`
* Can be gradually infused into react/JSX, reducing tree complexity
* Replacement to HOCs
* Natural hydration
* Folds complex JSX wrappers into semantic HTML tags
* Make html clean again
* Framework-agnostic hooks
* Reactless reactions
* Declarative JS
* Mods act like classical vanillajs initializers/components.
* They know nothing about vdom/dom, they're infrastructure-agnostic.
* Rendering a template for mods is just a side-effect.
* They can act as component glue.
* Elements are useEffects bodies by default with dependency on props.

[TODO: highly demonstrative generic example ]

```js
import spect from "https://unpkg.com/spect/dom"
import { fx, attr } from "https://unpkg.com/spect/fx"

// declare dom-aspect
spect('.app', el => {
  // register attributes listeners
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

  // called on unmount
  return () => {

  }
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

Non-DOM aspects:


```js

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


## Getting started

[TODO: 2-seconds connect via unpackage module]
[TODO: connect as direct dependency]
[TODO: another good example, not too specific]


## Effects


## `dom`

Mod is an alternative way to write custom elements code. Essentially mod is just a function, that has a set of side-effects via `@mod/fx` helpers. Side-effects are the concept very similar to react hooks.

### `state`

Same as react useState. Provides per-mod state:

```js
function mod (el) {
let [value, set] = st8(initialValue)
}
```

### `fx`

Side-effect for mod. Same as react `useEffect`:

```js
function mod (el) {
fx()
}
```

### fn

### gen

### call

### on

Attach event handlers to the element.

```js
el => {
on('evt', handler)
return () => {
off('evt')
}
}
```

### redux

Connect aspect to redux store

```js
let store = configureStore()

el => {
let {props} = redux(selector)
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

### a11y

Provides accessibility properties.

### seo

Provides schema description object for the mod.

### htm

Make sure element contains defined innerHTML via DOM diffing algo. It uses `htm` internally, connected to fast dom-diffing engine.

### gl

Multilayer gl canvas custom element.

```js
<GlCanvas>
  <Legend/>
  <Scatter/>
  <Axes/>
</GlCanvas>
```
### interval

```js
function mod () {
    interval(() => {}, 50)
}
```

### timeout

Schedule regular events

### route

Coditionally trigger element by matching route

### visible

Hide when not on the screen

### transition

### connect



## Integration with react

Aspects are interoperable with react.

To connect aspect to react, just put aspect into `ref` prop:

```jsx
<App>
<div className="fps-indicator" ref={aspect}/>
<custom-el></custom-el>
</App>
```

The aspect will manage it's state and effects well, as well as mount/unmount itself properly.

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

Hyperscript was a nice beginning. But introduction of Components in React was a mistake. It made JSX trees complex and shallow, detached them from HTML, made developers less skilled in HTML/CSS. That increased risk of situation mess both in generated and in source code (see tweet).

Spect is here to reestablish justice. They require no bundler since they rely on browser mechanisms to load scripts. They require no compilers for JSX since HTML is already here.


### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila



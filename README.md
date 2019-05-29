# Mods

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
* Natural hydration (mods initialized via HTML)
* Folds complex JSX wrappers into semantic HTML tags
* Make html clean again
* Framework-agnostic hooks
* Reactless reactions
* Component hierarchy
* Declarative JS for your web-app

```jsx
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
	        <section is="mod-feature"><section is="mod-feature"/><section is="mod-feature"/>

	        <footer class="mod-footer"/>
	    </article>
    </main>
</body>
```

## High-level replacement for react

* Mods act like classical vanillajs initializers/components.
* They know nothing about vdom/dom, they're infrastructure-agnostic.
* Rendering a template for mods is just a side-effect, unlike react.
* They can act as component glue.
* Elements are useEffects bodies by default with dependency on props.

```jsx
import

function App(el) {
  // location side-effect
  let [path, setPath] = location()

  // window.title side-effect
  let [title, setTitle] = title()

  // DOM render
  render`
    <main react=${App}>
    </main>
    <aside mount=${}
  `, el)
}
```

## Getting started

There are two ways to use mods in html.

```js
<script>
import dom from '@mod/dom'
import el from '@mod/custom-element'

// attach mod to dom (not custom element)
dom('.fps-indicator', import('fps-indicator'))

fx(() => {
// register DOM-selector to observe
$('.fps-indicator')

// call
fx(() => {
})

})

// create app
customElements.define('app-el', mod(el => {
}), {extends: 'main'})
</script>

<main is="app-el"/>
```

## `@mod/dom`

Mod is an alternative way to write custom elements code. Essentially mod is just a function, that has a set of side-effects via `@mod/fx` helpers. Side-effects are the concept very similar to react hooks.

### `@mod/state`

Same as react useState. Provides per-mod state:

```js
function mod (el) {
let [value, set] = st8(initialValue)
}
```

### `@mod/fx`

Side-effect for mod. Same as react `useEffect`:

```js
function mod (el) {
fx()
}
```

### mount

### unmount

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

Connect mod to redux store

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

Mods are interoperable with react.

To connect react component to mod, use `react` hook:

```js
import dom from '@mod/dom'
import react from '@mod/react'
import App from './App.jsx'

dom('.app', el => react(<App {...el.getAttributes()}/>)
```

To connect Mod to react, you don't need to do anything, mod uses native DOM, whether custom-elements or selector observers:

```jsx
<App>
<div className=".fps-indicator"/>
<custom-el></custom-el>
</App>
```


## Motivation

Hyperscript was a nice beginning. But introduction of Components was a mistake. It made JSX trees complex and shallow, detached them from HTML, made developers less skilled in HTML/CSS. That increased risk of situation mess both in generated and in source code (see tweet).

Mods are here to reestablish justice. They require no bundler since they rely on browser mechanisms to load scripts. They require no compilers for JSX since HTML is already here.

### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila










# spect

Aspects for DOM.

[Coming soon.]


<!--
Spect is similar to aspect/subject programming. For any object it creates a lifetime-companion function (so-called advice), that at defined moments performs additional actions. Classical examples: authentication, authorization, accounting, logging, etc.
That can be thought of as effects, put into a different adjacent functions.

```html
<script type="module">
  import spect, {diff, state} from "https://unpkg.com/spect/dom"

  spect('.app', el => {
    // init, update

    return () => {
      // destroy
    }
  })
</script>
```

[Material-components](https://github.com/material-components/material-components-web) example:

```html
<link href="https://unpkg.com/@material/ripple/dist/mdc-ripple.css" rel="stylesheet">
<script type="module">
  import fx from "https://unpkg.com/spect"
  import {MDCRipple} from 'https://unpkg.com/@material/ripple';

  // register ripple effect for all buttons on the page
  fx('button', el => {
    let ripple = new MDCRipple(el)
    el.classNames.add('mdc-ripple')

    () => {
      ripple.destroy()
    }
  }, [])
</script>

<button>Ripple</button>
```

Simulated canvas layers via DOM:

```html
fx('.plot', canvas => raf(
  () => {
    let ctx = canvas.getContext('2d')

    // clear canvas
    ctx.clearRect(0,0, canvas.width, canvas.height)

    // rerender all layers
    [...el.children].forEach(layer => {
      if (!(layer instanceOf CanvasLayer)) CustomElements.upgrade(layer, 'canvas-layer')

      layer.draw()
    })
  }
))
```

* `fx(selector, handler, attrs?)`
  - attributes are separate from selector
  - selector is passed as first arg to handler, not attrs
  - attributes aren't passed to handler (API inconsistency)
    ? `fx('tagName[attr1, attr2]', (el, attr1, attr2) => {})`
      + selector params are passed as args
        - messy selector parsing
      - too verbose selector
      + apparent indication of attribute difference
      - doesn't correspond to css selector (falsy values)
>   ? attributes effect `fx('tagName', el => { let {a, b, c} = attrs() })`
      + registers changes
      + consistent with props
  * selector/attrs reflect mutationobserver config, could make sense joining it


## Gems

* effectful functions, not bound to DOM
* cached state machine
* soft dom diff

## Hooks redesigned

* let [x, set] = state
  - local "store" is unseparable from update
    - that is addressed via useRef, that is super-confusing
  - oftentimes we see "fake" useState, `let [,update] = useState()` just to force rerender
  + we need just "local state" and/or "update"
  + if we use multiple set states in order, they trigger one after the other
* useEffect(() => { init; update; return destroy; }, deps)
  - scary name indeed
  - so much confusion using it: no clear understanding when it's been triggered or why `useEffect(fn, [])` !== `useEffect(fn)`
  - no definite indicator of triggering, sometimes it depends on forced "fake" id from `useState`, just to re-trigger it
  - no returning result
  - any attributes change cause retriggering destroy
  + mount/unmount are more apparent, although don't have shared state
  + change by condition is more apparent
  + conceptually there is
    * let shoot = load(() => {}), which can be async too
    * updateDiff(fn, deps), similar to update-diff
* useContext, useRef, useReducer are just ... react legacy stuff
* useMemo
  - because of signature conflict with useState, it requires redundant functional wrapper, could be `let result = memo(() => {})`
  - intuitively very similar to useEffect, but takes no deps list
*

*** spect is bad name: what if we want effectful handlers without DOM? how?
```js

function advice (obj) {
  // ...non-dom fx work
  dprop('a.b.c')
  on('evt', callback)
}

// we have to add that trait to some object
fxify(obj, advice)

// this way we can attach "sagas" to some store
fx(store, state => {
  on('specialEvent', () => {
    someAction
  })

  emit('event', () => {})
})

```

## Naming

* these are lifecycle companions, mods, effects, side-effects, behaviors, traits, satellites,
lifecycle functions applied to some object lifetime, called at some important points: init, end, stages, changes.
They compose a frain of an object's lifecycle. Ideally it runs on any object change.

-->

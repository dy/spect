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
* Framework-agnostic reactless hooks
* Reactless native reactions
* Component hierarchy

```jsx
import {Sidebar, Page, Navigation, Logo,'mod/sidebar'

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

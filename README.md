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
* Component hierarchy

```jsx
import {Sidebar, Page, Navigation, Logo,'mod/sidebar'

<body>
	<aside mod={Sidebar()}/>
	<main mod={Page()}>
		<div className="logo" mod-route/>
		<nav mod-intent="menu" mod-sticky/>

    	<article>
	        <header mod={SEO('header')}>
	        	<h1 mod={Typography({type})}>{page.title}</h1>
	        	<div mod={Share}/>
	        </header>

	        <section mod={Intro}/>
	        <section mod={Feature}/><section mod={Feature}/><section mod={Feature}/>

	        <footer mod={Footer}/>
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

function App(component, props) {
  // location side-effect
  let [path, setPath] = useLocation()

  // window.title side-effect
  let [title, setTitle] = useTitle()


  // DOM side-effect
  let [el, render] = useRender()
  render(html`
    <main react=${App}>
    </main>
    <aside mount=${}
  `, document.body)

  return
}
```

## API

### mod={},[],string,function

Initializes mod, list or dict of mods on an element.


## Standard mods

### mod-on={ event: handler }

Mod binding events to the element, considering naming, polyfilling etc.


### mod-react

Enables inner content to be react node, eg.

```js
// this renders inner JSX into component
<div id="root" mod-react>
	<App/>
</div>
```

### mod-redux


### mod-css={CSS}

Adds tachyons classnames corresponding to passed CSS object or string.

See ui-box.


### mod-a11y

Provides accessibility properties.


### mod-dataschema

Provides schema description object for the mod.


### mod-mount

Selector in the real dom to mount the mod on. Can be used to create portals ~~to another dimension~~.


### mod-gl

Can be used on canvas only. Enables children for canvas, rendering them as virtual layers.

```js
<canvas mod-gl>
	<gl-legend/>
	<gl-scatter/>
	<gl-axes/>
</canvas>
```

### mod-render

Takes a function to render the content. See https://github.com/streamich/react-universal-interface

### mod-fx

Invoke a function on attributes/lifecycle events.

### mod-state

Set a state for an element

### mod-interval, mod-timeout

Schedule regular events

### mod-route

Coditionally trigger element by matching route

### mod-lazy

Hide when not on the screen

### mod-transition

### mod-connect



### Infusing into react

Use `import React from '@mod/react'` instead of `import React from 'react'`.

That enables passing mods as props to any components.

```jsx
// composing with recompose
export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  reduxForm({form: 'MyForm'}),
  withPagination,
  withNavigation,
)(Page)

// composing with mods
<Page mod={[withPagination, withSubscription, reduxForm({ form:'MyForm' }), connect(state)]} />
```

```jsx
// context with react
render(
  <Provider store={store}>
  	<PersistGate loading="loading..." persistor={persistor}>
	    <ConnectedRouter history={history}>
	      <App />
	    </ConnectedRouter>
    </PersistGate>
  </Provider>,
  document.getElementById("root") as HTMLElement
)

// context with mods
<App mod-mount="#root" mod-context={[ Provider({store}), PersistGate({loaging, persistor}), ConnectedRouter({history})]}/>
```



## Motivation

Hyperscript was a nice beginning. But introduction of Components was a mistake. It made JSX trees complex and shallow, detached them from HTML, made developers less skilled in HTML/CSS. That brought to the situation of mess both in generated and in source code.
Mods are here to reestablish justice and clarity.

### Principles

* Sat, Chit, Ananda, Vigraha
* Nama, Rupa, Guna, Lila

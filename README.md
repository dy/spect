# Spect ![experimental](https://img.shields.io/badge/stability-experimental-red)

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework for creating expressive UIs.

:ferris_wheel: Formula:
> _Spect_ ≈ _selectors_ + _reactive aspects_ + _side-effects_

```js
import $ from 'spect';
import { route } from 'spect-router';
import { t, useLocale } from 'ttag';
import ky from 'ky';

// main app aspect - loading data logic
function main (app) {
  let $app = $(app)

  // match route from location
  let [ match, { id } ] = route`user/:id`;
  if (!match) return;

  // run state effect when `id` changes (useState + useEffect + idx)
  $app.state(async state => {
    state.loading = true;
    state.user = await ky.get`./api/user/${id}`;
    state.loading = false;
  }, id);

  // render html as side-effect
  $app.html`<p use=${i18n}>${
    $app.state`loading` ? `Hello, ${ $app.state`user.name` }!` : `Thanks for patience...`;
  }</p>`;
}

// preloader aspect - append spinner when loading state changes
function preloader (el) {
  let $el = $(el)
  $el.html(html => $`${ html } ${ $el.state`loading` && $`<canvas.spinner />` }`, $el.state`loading`);
}

// i18n aspect - translate content when `lang` attribute changes
function i18n (el) {
  let $el = $(el)
  useLocale($el.attr`lang` || $(document.documentElement).attr`lang`);
  $el.text(text => t(text))
}

// attach aspects to DOM
$('main#app').use(main, preloader);
```

## Concept

Spect is build with a set of modern framework practices in mind (proxies, tagged strings, virtual dom, incremental dom, htm, custom elements, hooks, observers, frp). It grounds on API design research, experiments and proofs, conducted with purpose of meeting the following principles:

> 1. Expressivity.
> 2. 0 bundling / building.
> 3. Soft hydration.
> 4. Standard HTML.
> 5. Max utility, min presentation.

<!--
Conceptually, app is a set of _reactions_ to changes in some _domain_.

_Reaction_ may have various side-_effects_, like changing html, css, page title, sound volume, displaying dialog etc. _React_ components provide main html side-effect per component, to provide other side-effects, the mechanism of hooks is introduced. In _jQuery_, any element may have an effect on any other element, but lack of component composition is 🍝.

_State_ can be any structure, representing some domain. In web, main domains are - data storage and DOM tree (besides navigation, web-audio, localstorage, webgl etc.). Reactions can be triggered by changes in these domains.

`$` function wraps any group of DOM nodes, providing connections to different domains - html, css, navigation, storage, events etc. The `fx` method serves as aspect for group, it works as `useEffect` merged with component renderer (component renderer conceptually _is_ effect too).

Other approaches include:

* Decomposition algorithm, aspects (CSS is aspect).
* streamlined html (fragment is container, attributes reflect domains, tagname is main domain indicator, children are implicit prop of syntax).
* streamlined effects (global is effect holder, effect scope is indicated in ref, effect corresponds to domain).
* streamlined subscription (autosubscribe to domain by reading it, sources of rerendering(target, subscriptions, direct gate call), soft/hard effects).
* optimization API equation (contextual effects → effect constructors → hooks namespace → html wrappers → events middleware).
* streamlined updates (batch updates after fx tick, clean up required diffs).
* streamlized html (orig holder, vdom, attaching fx, API, carrying over DOM nodes)
-->

## Installation

**A.** As _npm_ package:

[![npm install spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import $ from 'spect'

// ...UI code
```

**B.** As module<sup><a href="#principle-2">2</a></sup>:

```html
<script type="module">
import $ from 'https://unpkg.com/spect@latest?module'

// ...UI code
</script>
```


## Getting started


🎬 Let's build [basic examples](https://reactjs.org/) with _Spect_.

### A Simple Aspect

This example creates _html_ in body and assigns single aspect to it.

```js
import $ from 'spect'

$(document.body).html`<div id="hello-example" class="hello" name="Taylor" use=${hello}/>`

function hello (el) { el.html`Hello, ${ el.attr`name` }!` }
```

<p align='right'><a href="">Open in sandbox</a></p>


### A Stateful Aspect

_Spect_ introduces `.state` and `.fx` effects, similar to `useState` and `useEffect` hooks:

```js
import $ from 'spect'

$`#timer-example`.use(el => {
  el.state({seconds: 0}, [])

  el.mount(() => {
    let i = setInterval( () => el.state(s => s.seconds++), 1000 )

    // on unmount
    return () => clearInterval(i)
  })

  el.html`Seconds: ${el.state`seconds`}`
})

```

<p align='right'><a href="">Open in sandbox</a></p>


### An Application

Events are provided by `.on` effect, decoupling callbacks from markup and enabling event delegation. They can be used along with direct `on*` attributes.

```js
import $ from 'spect'

$`#todos-example`.use(Todo)

function Todo (el) {
  // init state
  el.state({ items: [], text: '' }, [])

  // listen for `submit` event
  el.on('submit', e => {
    e.preventDefault();

    if (!el.state`text.length`) return;

    const newItem = {
      text: el.state`text`,
      id: Date.now()
    };

    // in-place reducer
    el.state(({items}) => ({
      items: [...items, newItem],
      text: ''
    }))
  })

  // delegate event to #new-todo element
  el.on('change', '#new-todo', e => el.state({ text: e.target.value });

  // html effect
  el.html`
    <h3>TODO</h3>
    <main is=${TodoList} items=${ el.state`items` }/>
    <form>
      <label for=new-todo>
        What needs to be done?
      </label>
      <input#new-todo value=${ el.state`text` }/>
      <button>
        Add #${ el.state`items.length` + 1 }
      </button>
    </form>
  `
}

// TodoList component
function TodoList (el) {
  el.html`<ul>${ items.map(item => $`<li>${ item.text }</li>`) }</ul>`
}
```

<p align='right'><a href="">Open in sandbox</a></p>


### A Component

_Spect_ is able to create components via native web-components mechanism, as seen in previous example. Let's see how that can be used in composition.

```js
// index.js
import $ from 'spect'
import MarkdownEditor from './editor.js'

// MarkdownEditor is created as web-component
$`#markdown-example`.use(el => el.html`<${MarkdownEditor} content='Hello, **world**!'/>`)
```

```js
// editor.js
import $ from 'spect'
import Remarkable from 'remarkable'

export default function MarkdownEditor (el) {
  el.state({ value: el.prop`content` }, [ el.prop`content` ])

  el.class`markdown-editor`

  el.html`
    <h3>Input</h3>
    <label for="markdown-content">
      Enter some markdown
    </label>
    <textarea#markdown-content
      onchange=${e => el.state({ value: e.target.value })}
    >${ el.state`value` }</textarea>

    <h3>Output</h3>
    <div.content html=${getRawMarkup()}/>
  `
}

let getRawMarkup = () => {
  const md = new Remarkable();
  return md.render(el.prop`content`);
}
```

<p align='right'><a href="">Open in sandbox</a></p>


## API

<!-- Each effect reflects domain it provides shortcut to. -->

<!-- mount is a hook on html domain -->

[**`$`**]()  [**`.use`**]()  [**`.fx`**]()  [**`.state`**]()  [**`.prop`**]()  [**`.attr`**]()  [**`.html`**]()  [**`.text`**]()  [**`.class`**]()  [**`.on`**]()  [**`.css`**]()



### `$( selector | els | markup )` − hyperselector

Select elements in DOM, provide domain methods for the selected set. The main purpose is shallow reference/wrapper for some nodes collection.
If html string is passed, creates detached DOM - in that case acts like hyperscript.

```js
// query nodes
$`#id.class > div`
$(elements)
$`${ element } > div`

// create html
$`<div.a/><div.b/>`
$('div', {}, null)
```

<p align="right">Related: <a href="https://jquery.com">jquery</a></p>


### `.use( ...fns )` − attach aspects

Assign aspect function(s) to selected elements. Each `fn` is called for every element in the selected set, receiving wrapped element as single argument. Aspect `fn` can be be called multiple times in a frame, if `state`, `attr` or any other data source updates. The data sources are subscribed to automatically when their values are read.


```js
let outer = $`.outer`

els.use(xy)

function xy (el) {
  // subscribe to attribute updates
  let x = el.attr`x`
  let y = outer.attr`y`

  // rerender after 1s
  setTimeout(() => el.attr(a => a.x++), 1000)
}

// trigger xy externally
outer.attr('y', 1)
```

Aspects can be attached via `.html` effect as well:

```js
$els.html`<div use=${div => {}}></div>`
```

<p align="right">Related: <a href="https://ghub.io/reuse">reuse</a></p>


### `.fx( fn, deps? )` − run side-effects

Register effect function for selected elements. The effect `fn` is called after current aspect call for each element in the set. If called outside of running aspect/fx (global scope), then `fn` is called instantly.

```js
// called each time
$els.fx(() => {})

// called once
$els.fx(() => {}, [])

// called any time deps change
$els.fx(() => {}, deps)

// destructor
$els.fx(() => () => destroy(), deps)

// called for each element
$els.fx(el => $(el).something)
```

<p align="right">Related: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `.state( name | val, deps? )` − get/set elements state

Read or write state, associated with an element. Read returns state of the first element in the set. Reading state subscribes running aspect to rerender whenever that state changes. Writing state rerenders all dependent aspects after the current one.

```js
// write state
$target.state('x', 1)
$target.state({x: 1}, deps)
$target.state(_ => _.x.y.z = 1, deps)

// read state
$target.state`x`
$target.state`x.y.z`
$target.state('x', deps)
$target.state(_ => _.x.y.z, deps)
```


<p align="right">Related: <a href="https://reactjs.org/docs/hooks-state.html">useState</a>, <a href="https://www.npmjs.com/package/icaro">icaro</a>, <a href="https://www.npmjs.com/package/introspected">introspected</a></p>


### `.prop( name | val, deps? )` − get/set elements props

Read or write elements properties. Read returns first item property value. Set writes property to all elements in the set. Reading prop subscribes current aspect to rerender whenever that property changes.

```js
// write prop
$target.prop({x: 1})
$target.prop(_ => _.x.y.z = 1, deps) // safe path setter

// read prop
$target.prop`x`
$target.prop(_ => _.x.y.z, deps) // safe path getter
```

<p align="right">Related: <a href="https://reactjs.org/docs/hooks-state.html">useState</a></p>


### ``.html( markup, deps? ) `` − render markup

Provides HTML content for elements. Internally uses [htm](https://ghub.io/htm) with [incremental-dom](https://ghub.io/incremental-dom) to render tree.

```js
// set html
$target.html`...markup`
$target.html(html => $`...markup ${ $`...inner wrapped ${ html }` }`, deps)

/* @jsx $ */
$target.html(html => <>Markup</>)
```

#### Components

`html` effect provides ways to turn tags into custom elements, controlled by aspects.
For that purpose, `is` attribute can be used:

```js
$els.html`<button is=${SuperButton}></button>`
$els.html`<${SuperButton} />`

function SuperButton($el) {
  // ...
}
```

#### Examples

* [Popup-info example from MDN](https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry/define#Autonomous_custom_element):

<p align="right">Related: <a href="https://ghub.io/incremental-dom">incremental-dom</a>, <a href='https://ghub.io/htm'>htm</a></p>


### ``.text( content, deps? ) `` − get/set text content

Provide text content for group of elements.

```js
// set text
$target.text`...text`
$target.text(t => i18n(nbsp(typograf(t))))

// get text
$target.text()
```


### ``.css( styles, deps?)`` − render style sheets

Provide scoped CSS styles for element

```js
// write css
$target.css` :host { width: 100%} `

// read css
$target.css()
```

<!-- $target.css({ ':host': { width: 100%} }) -->
<!-- $target.css(rules => rules[':host'].width = '100%') -->
<!-- $target.css(':host').width -->
<!-- $target.css.path = obj|str -->
<!-- $target.css.path // obj -->
<!-- $target.css`selector { ...rules }` -->
<!-- $target.css = `selector { ...rules }` -->

<p align="right">Related: <a href="https://ghub.io/virtual-css">virtual-css</a></p>


### `.class( ...classes )` − get/set class list

Changes element classList, updates all dependent elements/aspects.

```js
// write classes
$target.class`foo bar baz`
$target.class('foo', true && 'bar', 'baz')
$target.class({ foo: true, bar: false, bas: isTrue() })
$target.class(clsx => clsx.foo = false)

// read classes
$target.class`foo`
$target.class().foo
```

<!-- $target.class = {foo: true, bar: false, baz: () => false} -->
<!-- $target.class // { foo: true, bar: true } -->

<p align="right">Related: <a href="https://ghub.io/clsx">clsx</a>, <a href="https://ghub.io/classes">classes</a></p>


### `.attr( name, deps? )` − get/set attributes

Changes element attributes, updates all dependent elements/aspects.

```js
// write attributes
$target.attr({ foo: 'bar'})
$target.attr(a => a.foo = 'bar')

// read attributes
$target.attr`foo`
$target.attr().foo
```


<p align="right">Related: <a href="https://ghub.io/attributechanged">attributechanged</a></p>


### `.on( evt, delegate?, fn )` − add/remove event listeners

Registers event listeners for a target, optionally pass `delegate` selector.

```js
// add event listeners
$target.on('foo bar', e => {})
$target.on('foo', '.delegate', e => {})
$target.on({ foo: e => {} })
```

`on` provides `mount` and `unmount` events for all aspects and components, to track when element is connected/disconnected from DOM.

```js
$target.on('mount', e => {
  $target.state({ loading: true })
})
$target.on('unmount', e => {

})
```

<p align="right">Related: <a href="https://github.com/donavon/use-event-listener">use-event-listener</a></p>

<!--
### `.init( fn: create => destroy )` - init / destroy lifecycle callbacks

Triggered during the first render, useful to initialize component state and other effects. Any effects or changes made in callback are muted, so rerendering won't trigger, unlike in effect `.fx( fn, [] )`.

```js
$('#target').use($el => {
  $el.init(() => {
    // ...create / init

    $el.state.x = 1
    $el.state.y = 2
    let i = setInterval(() => {})

    return () => {
      // ...destroy

      clearInterval(i)
    }
  })
})
```
-->

<!-- ### `.mount( fn: onmount => onunmount )` - connected / disconnected lifecycle callbacks

Triggers callback `fn` when element is connected to the DOM. Optional returned function is triggered when the element is disconnected.
If an aspect is attached to mounted elements, the `onmount` will be triggered automatically.

```js
$('#target'.use($el => {
  $el.mount(() => {
    // connected
    return () => {
      // disconnected
    }
  })
})
``` -->

<!--

## Plugins

* [spect-route]() - provide global navigation effect.
* [spect-request]() - async request provider.
* [spect-observe]() - selector observer.
* [spect-isect]() - intersection observer.

* [ ] local(value?)
* [ ] watch
* [ ] route
* [ ] isect(fn, target?)
* [ ] i18n
* [ ] resize

Community

* [spect-react]() - render react components in spect.
* [spect-redux]() - use state hooks, connected to redux store.
* [spect-gl]() - enable layers for gl-canvas element.
* [spect-a11y]() - enable a11y props for the element.
* [spect-dataschema]() - provide dataschema props for the element.
* [spect-meta]() - set document meta props.
* [spect-uibox]() -->


## FAQ

### Why aspects?

Aspects are, in fact, already a conceptual part of HTML, they manifest as:

* CSS - separation of markup concern from styling concern (selectors act as pointcuts, rules act as as advice) - compared to inline styling;
* Attributes - `hidden`, `contenteditable`, `title`, `autocapitalize` etc.

That concept is taken a step forward, enabling separation of other [cross-cutting concerns](https://en.wikipedia.org/wiki/Cross-cutting_concern), such as _authorization_, _localization_, _accessibility_, _microformats_, _logging_, _sound_, _formatting_, _analytics_ and others. In fact, any business-logic or domain-related concerns can be separated into own "layer".

The methodology is build based on known patterns/practices, such as selectors (jQuery), rendering functions (React functional components), side-effects (React hooks). <!-- It's proven that other approaches, such as pure hooks, while maintaining similar level of expressivity, provide less robustness for intercom -->

That way aspects gracefully solve many common standard frontend tasks, such as portals, code splitting, hydration etc.


### Portals?

Portals come out of the box as easy as:

```js
$`#app`.use(el => {
  $(el).html`Current content`

  $`#external-container`.html`Portal content`
})
```

### JSX?

Spect is jQuery/hyperscript compatible and is able to create vdom or real dom, depending on current effect context. To use JSX - provide babel pragma:

```js
/* @jsx $ */

// constructed as real DOM, diffed with element HTML
$el.html(<div>Inner content</div>)

// constructed as VDOM and applied after `html` effect
$el.html(() => <div>Inner content</div>)
```


### Code splitting?

Aspects organically embody progressive-enhancement principle, providing preloading parts of functionality in a meaningful way, reducing network load. Loading order can be arranged by priority of aspects from UX standpoint.

```html
<script>
// main app aspect
$('#app').is($app => {
  // ...main app
})
</script>

<script>
// i18n aspect
$('.t').use(i18n)

function i18n () {
  // ...translate content
}
</script>

<script>
// [lazy]-load data
$`.load`.use(el => {
  // ...load and display data for placeholder elements
})
</script>
```

UI can be analyzed and decomposed from aspects perspective, work delegated to multiple developers, smart bundling with code splitting can be avoided.


### Hydration?

Hydration in _Spect_ is just a matter of applying HTML effect to any wrapped element:

```js
$`#app`.html`<div#app-conent>...markup</>`
```

It comes out of the box and is applicable to any website, not only built with specially crafted backend, that can be just regular PHP.


<!--
### `use`, `fx` - what's the difference?

`is` provides single main aspect for an element via mechanism of web-components, if that's available. `is` aspect is always called first when element is updated.

`use` provides multiple secondary aspects for an element, called in order after the main one. `use` doesn't use custom elements for rendering themselves.

Both `is` and `use` are rendered in current animation frame, planning rerendering schedules update for the next frame.

`fx` provides a function, called after current aspect call. It is called synchronously in sense of processor ticks, but _after_ current renering aspect. Ie. aspect-less `fx` calls will trigger themselves instantly. -->


### Microfrontends?

_Spect_ doen't enforce framework restrictions, aspects can be assigned to any target:

```js
import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'spect'

$`#app`.use(el => {
  let { lang, theme } = $(el).attr()

  $(el).fx(() => {
    ReactDOM.render(el, <App lang={} theme={theme}/>)
  }, [lang, theme])
})
```


### Performance?

To be estimated and optimized.

In general, to reduce amount of rerendering, provide deps to every effect call:

```js
$els.use(el => {
  // bad
  $(el).fx(() => $(el).state(s => s.x = x))

  // good
  $(el).fx(() => $(el).state(s => s.x = x), x)
})
```

Also, try using VDOM over regular DOM, that promises to be faster (to be estimated):

```js
$els.use(el => {
  // slower
  $(el).html`...heavy markup`

  // faster due to VDOM
  $(el).html(_ => $`...heavy markup`)
})
```
<!-- Although that can be fixed, if decided that HTML must be applied on the next frame only and always be VDOM (to be figured out). -->

_Spect_ allows a bunch of static optimizations (unwrapping vdom, unwrapping state/attr/prop access etc), potentially even compiled into binary for webassembly (matter of experiments).


### Own build?

_Spect_ is fully modular, so that effects are independent and allow creating custom build by requiring sub-modules.

For example, to pick minimal bundle `$` + `html`:

```js
import $ from 'spect/$'
import html from 'spect/html'

// register effects
$.fn.html = html

// use effects
$`#my-element`.html`...markup`
```


### Creating plugins?

Creating plugins for Spect can in a way resemble jQuery plugins.

For example, consider `toString` effect, serializing elements.

```js
// to-string.js
export default function toString({ attr }) {
  let parts = []

  // for all elements in a set
  this.forEach(el => {
    parts.push(toObject(el, attr))
  })


  return JSON.stringify(parts)
}

function toObject(el, whitelist) {
  let attributes = {}

  if (whitelist) {
    for (let attr in whitelist) {
      attributes[attr] = el.attributes[attr]
    }
  }
  else {
    for (let attr of el.attributes) {
      attributes[attr.name] = attr.value
    }
  }

  return { tag: el.tagName.toLowerCase, attributes, children: [...el.children].map(el => toObject(el, whitelist)) }
}
```

```js
// main.js
import $ from 'spect/$'
import toString from './to-string.js'

$.fn.toString = toString

// use `toString` on elements as
$`.stringify`.toString({ attr: ['href'] }) // "[...serialized result of selected set]"
```


### Modular use?


_Spect_ effects can be used on their own, beyond DOM context:

```js
import use from 'spect/use'
import state from 'spect/state'
import $ from 'spect/$'


$(['a', 'b', 'c']).use(str => {
  let $str = $(str)
  $str.state({ count: 0 }, [])

  console.log($str.state`count`)

  setTimeout(() => {
    $str.state(s => s.count++)
  }, 1000)
})
```

### Replace document context?

_Spect_ can be assigned to another document context, like [jsdom](https://ghub.io/jsdom):

```js
import Spect from 'spect'
const jsdom = require("jsdom")
const { JSDOM } = jsdom
const dom = new JSDOM(`<!DOCTYPE html><p>Hello world</p>`)

const $ = Spect.bind(dom.window.document)
```


## Changelog

Version | Changes
---|---
4.0.0 | Functional effects redesign.
3.0.0 | References approach.
2.1.0 | Reintroduce hoooks.
2.0.0 | Global effects approach.
1.0.0 | HTM compiler refactored.


## Acknowledgement


_Spect_ would not be possible without brilliant ideas from many libraries authors, hence the acknowledge to authors of

* _jquery_
* _react_
* _atomico
* hui_
* _htm_
* _fast-on-load_
* _tachyons
* tailwindcss
* ui-box_
* _evergreen-ui
* material-ui_
* _reuse_
* _selector-observer_
* _material-design-lite_
* _funkia/turbine_

and others.

<!-- * _***_ - for letting that be possible. -->


##

<p align="right">HK</p>

<!--
<p align="center">Made on Earth by your humble servant.

<p align="center"><em>Sat, Chit, Ananda, Vigraha.</em><br/><em>Nama, Rupa, Guna, Lila.</em></p> -->


## FAQ

### Why aspects?

Aspects are already a conceptual part of HTML:

* CSS - visual aspect, separated from structure (selectors act as pointcuts, rules act as as advice);
* Attributes - `hidden`, `contenteditable`, `title`, `autocapitalize` etc.

That concept is taken a step forward, enabling separation of [cross-cutting concerns](https://en.wikipedia.org/wiki/Cross-cutting_concern): _authorization_, _localization_, _accessibility_, _microformats_, _logging_, _sound_, _formatting_, _analytics_ and others. Any business-logic or domain-related concern can be separated into own aspect.

<!-- The API is based on known patterns/practices, such as selectors (jQuery), rendering functions (React functional components), side-effects (React hooks). It's proven that other approaches, such as pure hooks, while maintaining similar level of expressivity, provide less robustness for intercom -->

Aspects gracefully solve many common standard frontend tasks, such as portals, code splitting, hydration etc.


### Portals?

Portals come out of the box:

```js
$`#app`.use(el => {
  $(el).html`Current content`

  $`#external-container`.html`Portal content`
})
```

### JSX?

Spect is hyperscript compatible and is able to create vdom or real dom, depending on current effect context. To use JSX - provide babel pragma:

```js
/* @jsx $ */

// constructed as real DOM, diffed with element HTML
$el.html(<div>Inner content</div>)

// constructed as VDOM and applied after `html` effect
$el.html(() => <div>Inner content</div>)
```


### Code splitting?

Aspects organically embody progressive-enhancement principle, providing loading parts of functionality in a meaningful way, reducing network load. The order can be arranged by priority of aspects from UX standpoint.

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


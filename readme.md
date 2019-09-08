# Spect ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Spect is [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) tool. It enables reactive aspects with side-effects for any target.

> _Spect_ = _Reactive Aspects_ + _Side-Effects_


[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import spect from 'spect'
import { html, attr, css } from 'spect-dom'

spect.use(html, attr, css)

spect(document.querySelector('#hello'))
  .use(({ html, attr }) => {
    html`<h1.hello-title>Hello, ${ attr('name') }!</h1>`
    css`.hello { font-size: 1.08rem }`
  })
```

## API

[**`spect`**](#-selector--els--markup---selector--h)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp;

### `spect.use( ...effects )`

Register effects.

```js
import spect from 'spect'
import { css, html } from 'spect-dom'

spect.use(css, html)
```

### `target = spect( object )` − create aspectable target

Make any target aspectable.

```js
spect(() => {})
let target = spect([a, b, c])
```

### `target.use( ...fns )` − assign aspects

Assign aspect function(s) to target. Each aspect `fn` is called as microtask. By reading state of other targets, aspect subscribes to changes in these states and rerenders itself if changes take place.

```js
let $foo = spect(foo)
let $bar = spect(bar)

$foo.use($foo => {
  // subscribe to updates
  let x = $foo.state('x')
  let y = $bar.prop('y')

  // update after 1s
  setTimeout(() => $foo.state( a => a.x++ ), 1000)
})

// reruns $foo
$bar.prop('y', 1)
```

### `target.update( fn?, deps? )` − rerender aspect

Rerender all assigned aspects or a single aspect.

```js
let $foo = spect(foo).use(fooble, barable, bazzable)

$foo.update()
```

### `target.fx( () => destroy? , deps? )` − generic side-effect

Run effect function, queued as microtask. Very much like `useEffect` with less limitations. Non-array `deps` can be used to organize toggle / fsm that triggers when value changes to non-false, that is useful for binary states like `visible/hidden`, `disabled/enabled`, `active` etc.

```js
// called each time
target.fx(() => {});

// called when value changes to non-false
target.fx(() => { show(); return () => hide(); }, visible);

// called on init only
target.fx(() => {}, []);

// destructor is called any time deps change
target.fx(() => () => {}, deps);
```

<p align="right">Ref: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `target.state( name | val, deps? )` − get/set state

Read or write state associated with target. Reading returns first element state in the set. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define bypassing strategy, see `.fx`.

```js
// write state
target.state('foo', 1)
target.state({ foo: 1 })
target.state('foo.bar.baz', 1) // safe-path set

// mutate/reduce
target.state(s => s.foo = 1)
target.state(s => {...s, foo: 1})

// init
target.state({foo: 1}, [])

// read (first element)
target.state('foo')
target.state('foo.bar.baz') // safe-path get

// read full
target.state()
```

### `target.prop( name | val, deps? )` − get/set properties

Read or write target properties. Same as `.state`, but provides access to element properties.

```js
// write prop
target.prop('foo', 1)
target.prop({foo: 1})

// mutate
target.prop(p => p.foo = 1)

// reduce
target.prop(p => {...p, foo: 1})

// init
target.prop({foo: 1}, [])

// read first element prop
target.prop('foo')

// read all
target.prop()
```

### `target.then()` - effect queue

Effects are stacked up by default, for example, `html` is not rendered instantly, but put into microtask queue. This way, collections are thenable.

```js
await spect([foo, bar, baz])
  .attr('href', '/')
  .html('Home')
  .use(MaterialButton)
```

## Plugins API

### `registerEffect(name, descriptor | fn)`

Register new effect for spect prototype.

`descriptor` is used for generic domain-accessing effects, should be an object with the following properties:

```js
registerEffect('domain', {
  // domain()
  getValues: target => values,

  // domain(name)
  getValue: (target, name) => value,

  // domain(obj, deps?)
  setValues: (target, values) => {},

  // domain(name, value)
  setValue: (target, name, value) => {},

  // enable deps check as last argument for setValues/setValue methods
  deps: true

  // domain`...`
  template: (target, static, ...parts) => {},
})
```

For advanced effects, a function can be passed:

```js
registerEffect('custom', (test) => {
  return (arg, deps) => {
    // deps check
    if (!test(deps)) return

    // ...effect code
  }
})
```

## Changelog

Version | Changes
---|---
6.0.0 | Separate spect-core, spect-dom. DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

##

<p align="center">HK</p>

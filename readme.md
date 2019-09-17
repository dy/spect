# Spect ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Reactive [aspect-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework.


[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
```


## API

[**`spect.fn`**](#spectfn-fns----register-effects)&nbsp;&nbsp; [**`spect`**](#spect-target---create-aspectable)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.run`**](#run-fns-deps----run-aspects)&nbsp;&nbsp; [**`.dispose`**](#dispose-fns----remove-aspect)&nbsp;&nbsp; [**`.fx`**](#fx-------bool--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---getset-state)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---getset-properties)&nbsp;&nbsp;

### `spect.fn( ...fns )` - register effects

Register effect(s) available for targets.

```js
import spect, { state, prop, fx } from 'spect'
import { html, css, attr } from 'spect-dom'

spect.fn(state, prop, fx, html, css, attr)

let target = spect(document.querySelector('#my-element'))

// use effects
target.attr('foo', 'bar')
target.html`...markup`
target.css`...styles`
```

### `spect( target? )` − create aspectable

Turn target into aspectable. The wrapper provides transparent access to target props, extended with registered effects via Proxy. `use` and `run` effects are provided by default, other effects must be registered via `spect.fn(...fxs)`.

```js
import spect, { state } from 'spect'

spect.fn(state)

let foo = {}
foo = spect(foo)

// targets are thenable
await foo.use(foo => {
  console.log(foo.state('count'))

  // rerender
  setTimeout(() => foo.state( state => state.count++ ), 1000)
})

// re-run all aspects
target.run()
```

### `.use( fns? )` − assign aspects

Assign aspect(s) to target. Each aspect `fn` is invoked as microtask. By reading/writing effects, aspect subscribes/publishes changes, causing update.

```js
import spect, { prop, state } from 'spect'

spect.fn(prop, state)

let foo = spect({})
let bar = spect({})

foo.use(foo => {
  // subscribe to updates
  let x = foo.state('x')
  let y = bar.prop('y')

  // update after 1s
  setTimeout(() => foo.state( state => state.x++ ), 1000)
})

// update foo
bar.prop('y', 1)
```

### `.update( fns?, deps? )` - run aspect(s)

(re-)Run assigned aspects. If `fn` isn't provided, rerenders all aspects. `deps` control the conditions when the aspect must be rerun, they take same signature as `useEffect` hook.

```js
import spect from 'spect'

let foo = spect({})

foo.use(a, b)

// update only a
await foo.update(a)

// update all
await foo.update()
```

### `.dispose( fns? )` - remove aspect

Remove assigned aspects. If `fn` isn't provided, removes all aspects.

```js
import spect from 'spect'

let foo = spect({})

foo.use(a, b)

// remove a
await foo.dispose(a)

// remove all
await foo.dispose()
```


### `.fx( () => (() => {})? , bool | deps? )` − generic side-effect

Run effect function as microtask, conditioned by `deps`. Very much like [`useEffect`](https://reactjs.org/docs/hooks-effect.html) with less limitations, eg. it can be nested into condition. Boolean `deps` can be used to organize toggle / FSM that triggers when value changes to non-false, which is useful for binary states like `visible/hidden`, `disabled/enabled` etc.

```js
import spect, { fx } from 'spect'

spect.fn(fx)


let foo = spect()

// called each time
foo.fx(() => {});

// called on init only
foo.fx(() => {}, []);

// destructor is called any time deps change
foo.fx(() => () => {}, [...deps]);

// called when value changes to non-false
foo.fx(() => { show(); return () => hide(); }, visible);
```


### `.state( name | val, deps? )` − get/set state

Read or write state associated with target. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define trigger condition, see `.fx`.

```js
import spect, { state } from 'spect'

spect.fn(state)


// write state
$foo.state('foo', 1)
$foo.state({ foo: 1 })

// mutate/reduce
$foo.state(s => s.foo = 1)
$foo.state(s => ({...s, foo: 1}))

// init
$foo.state({foo: 1}, [])

// read
$foo.state('foo')
$foo.state()
```


### `.prop( name | val, deps? )` − get/set properties

Read or write target properties. Same as `.state`, but provides access to element properties.

```js
import spect, { prop } from 'spect'

spect.fn(prop)


// write prop
$foo.prop('foo', 1)
$foo.prop({foo: 1})

// mutate/reduce
$foo.prop(p => p.foo = 1)
$foo.prop(p => ({...p, foo: 1}))

// init
$foo.prop({foo: 1}, [])

// read
$foo.prop('foo')
$foo.prop()
```

### Standalone effects

Effects can be used on their own, without `spect`:

```js
import { fx, state, prop } from 'spect'

let foo = {x: 1}

state.call(foo, 'y', 2)
prop.call(foo, 'x', 3)

fx.call(foo, () => {
  state.call(foo, 'y') // 2
  state.call(foo, 'x') // 3
})
```


<!--
#### Internals

Internal methods are available for effects as

```js
import spect, { symbols } from 'spect'

spect.fn(function myEffect (arg, deps) {
  // `this` is `spect` instance
  // `this[symbols.target]` - initial target object

  // `this._deps(deps, destructor)` - is dependencies gate
  if (!this._deps(deps, () => { /* destructor */})) return this

  // `this._pub(path)` - publishes update of some name / path string
  // `this._sub(path, aspect?)` - subscribes current aspect to paths
  // `this[symbols.subscription]` - subscriptions dict
  // `this._run(aspect)` - runs aspect as microtask
  // `this[symbols.promise]` - internal queue
  // `this[symbols.aspects]` - internal map of assigned aspects

  return this
})
```
-->


## Changelog

Version | Changes
---|---
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

##

<p align="center">HK</p>

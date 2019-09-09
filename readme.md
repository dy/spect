# Spect ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Spect is [aspects](https://en.wikipedia.org/wiki/Aspect-oriented_programming) provider for objects.

> _Spect_ = _Reactive Aspects_ + _Side-Effects_

```js
import spect from 'spect'

// create aspectable
let foo = spect()

// add timer aspect
foo.use(foo => {
  console.log(foo.state('count'))

  // rerender after 1s
  setTimeout(() => foo.state( state => state.count++ ), 1000)
})
```


[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)


## API

[**`spect`**](#-selector--els--markup---selector--h)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp;

### `spect.registerEffect( ...effects )`

Register effects available for wrapped targets. By default _spect_ comes with _prop_, _fx_ and _state_ effects.

```js
import spect from 'spect'
import { css, html, attr } from 'spect-dom'

spect.registerEffect(css, html, attr)

let target = spect(document.querySelector('#my-element'))

target.attr('foo', 'bar')
target.html`...markup`
target.css`...styles`
```

### `spect( target )` − create aspectable

Create aspectable target wrapper. The wrapper provides transparent access to target props, extended with registered effects.

```js
let target = spect({ foo: 'bar' })

// properties are transparent
target.foo // 'bar'

// registered effects shade properies
target.use // function

// effects are awaitable
await spect(element).fx(() => { /* ... */ }, [])
```

### `.use( ...fns? )` − assign aspects

Assign aspect to target. Each aspect `fn` is invoked as microtask. By reading/writing effects, aspect subscribes/publishes changes, causing update.

```js
let foo = spect(foo)
let bar = spect(bar)

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

### `.run( fn?, deps? )` - run aspect

Rerenders aspect. If `fn` isn't provided, rerenders all aspects.

```js
let foo = spect({})

foo.use(a, b)

// update only a
await foo.run(a)

// update all
await foo.run()
```


### `.fx( () => destroy? , deps? )` − generic side-effect

Run effect function, queued as microtask, conditioned by `deps`. Very much like `useEffect` with less limitations. Non-array `deps` can be used to organize toggle / fsm that triggers when value changes to non-false, which is useful for binary states like `visible/hidden`, `disabled/enabled` etc.

```js
// called each time
foo.fx(() => {});

// called on init only
foo.fx(() => {}, []);

// destructor is called any time deps change
foo.fx(() => () => {}, [...deps]);

// called when value changes to non-false
foo.fx(() => { show(); return () => hide(); }, visible);
```

<p align="right">Ref: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `.state( name | val, deps? )` − get/set state

Read or write state associated with target. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define trigger condition, see `.fx`.

```js
// write state
$foo.state('foo', 1)
$foo.state({ foo: 1 })
$foo.state('foo.bar.baz', 1) // safe-path set

// mutate/reduce
$foo.state(s => s.foo = 1)
$foo.state(s => {...s, foo: 1})

// init
$foo.state({foo: 1}, [])

// read (first element)
$foo.state('foo')
$foo.state('foo.bar.baz') // safe-path get

// read full
$foo.state()
```

### `.prop( name | val, deps? )` − get/set properties

Read or write target properties. Same as `.state`, but provides access to element properties.

```js
// write prop
$foo.prop('foo', 1)
$foo.prop({foo: 1})

// mutate
$foo.prop(p => p.foo = 1)

// reduce
$foo.prop(p => {...p, foo: 1})

// init
$foo.prop({foo: 1}, [])

// read first element prop
$foo.prop('foo')

// read all
$foo.prop()
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

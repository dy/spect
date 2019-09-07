# Spect ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Spect is [_aspect_-oriented](https://en.wikipedia.org/wiki/Aspect-oriented_programming) framework.

> _Spect_ = _Collections_ + _Reactive Aspects_ + _Side-Effects_


[![npm i spect](https://nodei.co/npm/spect.png?mini=true)](https://npmjs.org/package/spect/)

```js
import spect from 'spect'

//
```

## API

[**`spect`**](#-selector--els--markup---selector--h)&nbsp;&nbsp; [**`.use`**](#use-fns---assign-aspects)&nbsp;&nbsp; [**`.fx`**](#fx-el--destroy--deps---generic-side-effect)&nbsp;&nbsp; [**`.state`**](#state-name--val-deps---state-provider)&nbsp;&nbsp; [**`.prop`**](#prop-name--val-deps---properties-provider)&nbsp;&nbsp;


### `target = spect( object | array )` − create aspectable collection

Wrap any target / collection into aspectable collection.

```js
let collection = spect([a, b, c])
```

### `target.use( ...fns )` − assign aspects

Assign aspect function(s) to aspected set. Each aspect `fn` is called as microtask, for each wrapped item. By reading state(s) of other elements, aspect subscribes to changes in these states and rerenders itself if changes take place.

```js
let $foo = spect(foo)
let $bar = spect(bar)

$foo.use($el => {
  // subscribe to updates
  let x = $el.state('x')
  let y = $bar.prop('y')

  // rerender after 1s
  setTimeout(() => $el.state( a => a.x++ ), 1000)
})

// triggers rerendering $foo
$bar.prop('y', 1)
```

### `target.fx( () => destroy? , deps? )` − generic side-effect

Run effect function for items in collection (queued as microtask, called immediately after current callstack). Very much like `useEffect`, with less limitations. Non-array `deps` can be used to organize toggle / fsm that triggers when value changes to non-false, that is useful for binary states like `visible/hidden`, `disabled/enabled`, `active` etc. Effect function is run for every element in collection.

```js
// called each time
$els.fx(() => {});

// called when value changes to non-false
$els.fx(() => { show(); return () => hide(); }, visible);

// called on init only
$els.fx(() => {}, []);

// destructor is called any time deps change
$els.fx(() => () => {}, deps);
```

<p align="right">Ref: <a href='https://reactjs.org/docs/hooks-effect.html'>useEffect</a></p>


### `target.state( name | val, deps? )` − state provider

Read or write state associated with an element. Reading returns first element state in the set. Reading subscribes current aspect to changes of that state. Writing rerenders all subscribed aspects. Optional `deps` param can define bypassing strategy, see `.fx`.

```js
// write state
$els.state('foo', 1)
$els.state({ foo: 1 })
$els.state('foo.bar.baz', 1) // safe-path set

// mutate/reduce
$els.state(s => s.foo = 1)
$els.state(s => {...s, foo: 1})

// init
$els.state({foo: 1}, [])

// read (first element)
$els.state('foo')
$els.state('foo.bar.baz') // safe-path get

// read full
$els.state()
```

### `set.prop( name | val, deps? )` − properties provider

Read or write elements properties. Same as `.state`, but provides access to element properties.

```js
// write prop
$els.prop('foo', 1)
$els.prop({foo: 1})

// mutate
$els.prop(p => p.foo = 1)

// reduce
$els.prop(p => {...p, foo: 1})

// init
$els.prop({foo: 1}, [])

// read first element prop
$els.prop('foo')

// read all
$els.prop()
```

### `target.update( deps? )` − rerender aspect

Utility method, rerendering all element aspects. Not for regular use, it can trigger redundant rerenders and cause unwanted side-effects.

```js
$els = spect([foo, bar, baz]).use(fooble, barable, bazable)

$els.update()
```


### `target.then()` - effect queue

Effects are stacked up by default, for example, `html` is not rendered instantly, but put into microtask queue. This way, collections are thenable.

```js
await spect([foo, bar, baz])
  .attr('href', '/')
  .html('Home')
  .use(MaterialButton)
```


### `registerEffect(name, descriptor | () => descriptor)`

Register new effect for spect prototype. Needed mostly for domain-specific spect implementations, like [spect-dom](https://ghub.io/spect-dom) or plugin developers.

Descriptor is an object with the following properties:

```js
{
  getValues: target => values,
  getValue: (target, name) => value,

  setValues: (target, values) => {},
  setValue: (target, name, value) => {},

  template: (target, static, ...parts) => {},

  deps: true
}
```


## [FAQ](./faq.md)

## Changelog

Version | Changes
---|---
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.0 | [jsxify](https://github.com/scrapjs/jsxify) JSX R&D

##

<p align="center">HK</p>

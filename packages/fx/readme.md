# @spect/fx ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Reactive [aspects](https://en.wikipedia.org/wiki/Aspect-oriented_programming) for javascript objects.


[![npm i @spct/fx](https://nodei.co/npm/@spct/fx.png?mini=true)](https://npmjs.org/package/@spct/fx/)

```js
import spect from '@spect/core'
import fx from '@spect/fx'

spect.fn(state)

let foo = {}
foo = spect(foo)

// called each time
foo.fx(() => {});

// called on init only (within an aspect)
foo.fx(() => {}, []);

// destructor is called any time deps change
foo.fx(() => () => {}, [...deps]);

// called when value changes to non-false
foo.fx(() => { show(); return () => hide(); }, visible);


// standalone
fx.call(target, () => {
  // ...effect code
})
```

##

<p align="center">HK</p>

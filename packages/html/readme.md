# @spect/html ![unstable](https://img.shields.io/badge/stability-unstable-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Reactive [aspects](https://en.wikipedia.org/wiki/Aspect-oriented_programming) for javascript objects.


[![npm i @spect/html](https://nodei.co/npm/@spect/html.png?mini=true)](https://npmjs.org/package/@spect/html/)

```js
import spect from '@spect/core'
import html from '@spect/html'

spect.fn(html)

let foo = {}
foo = spect(foo)

// timer aspect
foo.use(foo => {
  console.log(foo.state('count'))

  // rerender
  setTimeout(() => foo.state( state => state.count++ ), 1000)
})
```


##

<p align="center">HK</p>

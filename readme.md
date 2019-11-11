# Spect ![experimental](https://img.shields.io/badge/stability-experimental-yellow) [![Build Status](https://travis-ci.org/spectjs/spect.svg?branch=master)](https://travis-ci.org/spectjs/spect)

Spect provides aspect-oriented approach to building UIs.

```js
import { $, fx, html, attr, local, route } from 'spect'
import { useRoute, useEffect } from 'unihook'
import { t, useLocale } from 'ttag'

// main app element aspect
element('#app', (app) => {
  let [ params ] = useRoute('users/:id')
  let [ user, , loading ] = useAction('load-user', [params.id])
  useAttribute(app, 'loading', () => loading, [loading])

  return <p id='app' class='i18n preloadable'>{ !loading ? `Hello, ${ user.name }!` : `Thanks for patience...` }</p>
})

// loading data action
action('load-user', ({ id }) => {
  let [app] = useElement('#app')
  let [setLoading] = useAttribute()
  return await fetch`./api/user/${ id }`
})

// preloader aspect stream
element('.preloadable', el => {
  content = [...this.childNodes]
  progress = <progress.progress-circle />
  html`<${this}>${ this.loading ? this.progress : this.content }</>`
})

// i18n aspect stream
element('.i18n', el => {
  let [lang] = useAttribute(document.documentElement, 'lang')
  let textContent = t(this.str)

  this.str = this.textContent
})
```

At the core of spect is actionable reactive aspects with streamy hooks as dependencies. Every aspect has corresponding hook.

* `effect` - generic aspect, takes a function and turns it into hookable aspect.
* `element` enables aspect defined on elements, with result, updating the content of some element.
* `action` describes some page/app action, available in the app.
* `store` aspect defines store(model), identifiable by some target or id.
* `event` - describes aspect of interaction, from event source to side-effects.

## Changelog

Version | Changes
---|---
11.0.0 | Reactive aspects.
10.0.0 | Web-streams.
9.0.0 | Effects as asynchronous iterators.
8.0.0 | Atomize: split core $ to multiple effects.
7.0.0 | Deatomize; single core approach; ref-based approach.
6.0.0 | DOM-less core. Pluggable effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API. Effect queues.
4.0.0 | Functional effects API design.
3.0.0 | References + proxy-based API design.
2.0.0 | Global effects API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags.
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).

<p align="right">HK</p>

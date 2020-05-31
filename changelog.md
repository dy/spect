# Changelog

Version | Changes
---|---
22.0.0 | v reduced to simple observable. Removed i, a.
21.4.0 | HTM-based h with static caching.
21.3.0 | HTM-based h - dropping metaprogramming due to complexity and poor result (~40% faster than HTM-based, but way less reliable).
21.2.0 | Metaprogramming-based h algorightm, faster hyperscript algo (not really.)
21.0.0 | Faster `h` algorithm, `i` and `a` entries.
20.0.0 | Stage 3: `$` live collections, `h` caching & templates, `v` errors & template literals.
19.1.0 | Sealed deps on `v`. Observed dep props.
19.0.0 | Reduced API: `$`, `h`, `v`.
18.0.0 | Reduced API: `$`, `h`, `v`, `o`, `e`.
17.0.0 | Removed `list`. `$` now creates live collection. Complete set of v2.0/v8.0-like effects.
16.1.0 | Expose `get`, `set`, `subscribe`, `next`. Make effects return `channel` or `value`.
16.0.0 | `observ`/`observable`-compatible implementation.
15.1.0 | `ref` + `channel` merged into `bus` - accessor/channel primitive. `symbol.bus` and `symbol.observable` introduced.
15.0.0 | Reactive `html` effect, `input`, better more optimized core.
14.0.0 | $ is considered a selector observer special effect, added the generic effect `fx` and observables `state`, `calc`, `ref`, `store` etc.
13.0.0 | Repository reset (orphan branch). Minimal selector-observer implementation, single $ entry.
12.0.0 | Internalized hooks via augmentor, dropped unihooks dep. Equivalent of [hooked-elements](https://github.com/WebReflection/hooked-elements).
11.0.0 | Aspects single entry with enabled hooks via unihooks.
10.0.0 | Web-streams, ReadableStream polyfill.
9.0.0 | Effects as asynchronous iterables.
8.0.0 | Atomize: split core $ to multiple effects.
7.0.0 | Deatomize. Single core approach. Ref-based approach - with `$(target).fx()`.
6.0.0 | DOM-less core. Pluggable atomic effects.
5.0.0 | Wrapper as aspect argument, along with props for react-compatible API (tape-like). Effect queues. `$(sel, ({element, fx, state}) => {})`
4.0.0 | Functional effects (not methods) API design.
3.0.0 | Wrapped elements jquery-like proxy-based API design `let $el = $(selector); $el.fx();`.
2.0.0 | Hooks-like global effects (`fx`, `state` etc) API design.
1.0.0 | HTM compiler remake with support for anonymous attributes, html-comments and unclosed tags, later [xhtm](https://ghub.io/xhtm).
0.0.1 | [jsxify](https://github.com/scrapjs/jsxify) R&D.
0.0.0 | Mod framework (Modifiers for DOM).


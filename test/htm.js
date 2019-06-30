import tape from 'tape'
import htm from '../src/htm.js'

test('empty', () => {
  expect(htm``).toEqual(undefined);
});

// TODO: htm bugs.
// 1. CACHE doesn't cache
// 2. quotes don't escape themselves
// console.log(h`<a x="ab\"c"def />`)
// 3. make anonymous props possible (available by index key)

test.only('anonymous attributes', () => {
  console.log(htm`<a x ${() => {}} y=1 z=${2}><b/></a>c`)
})

test('single named elements', () => {
  // console.log(h`<a x y=1 z=${2}><b/></a>c`)
  // console.log(h`<a></a>abc`)
  // console.log(h`a${123}c`)
  // console.log(h`${123}`)
  // console.log(h`<a x y=1 z=${2} ...${{}}/>`)

  t.deepEqual(htm`<div />`, {tag: 'div'});
  expect(htm`<div/>`).toEqual({ tag: 'div', props: null, children: [] });
  expect(htm`<span />`).toEqual({ tag: 'span', props: null, children: [] });
});

test('multiple root elements', () => {
  expect(htm`<a /><b></b><c><//>`).toEqual([
    { tag: 'a', props: null, children: [] },
    { tag: 'b', props: null, children: [] },
    { tag: 'c', props: null, children: [] }
  ]);
});

test('single dynamic tag name', () => {
  expect(htm`<${'foo'} />`).toEqual({ tag: 'foo', props: null, children: [] });
  function Foo () {}
  expect(htm`<${Foo} />`).toEqual({ tag: Foo, props: null, children: [] });
});

test('single boolean prop', () => {
  expect(htm`<a disabled />`).toEqual({ tag: 'a', props: { disabled: true }, children: [] });
});

test('two boolean props', () => {
  expect(htm`<a invisible disabled />`).toEqual({ tag: 'a', props: { invisible: true, disabled: true }, children: [] });
});

test('single prop with empty value', () => {
  expect(htm`<a href="" />`).toEqual({ tag: 'a', props: { href: '' }, children: [] });
});

test('two props with empty values', () => {
  expect(htm`<a href="" foo="" />`).toEqual({ tag: 'a', props: { href: '', foo: '' }, children: [] });
});

test('single prop with static value', () => {
  expect(htm`<a href="/hello" />`).toEqual({ tag: 'a', props: { href: '/hello' }, children: [] });
});

test('single prop with static value followed by a single boolean prop', () => {
  expect(htm`<a href="/hello" b />`).toEqual({ tag: 'a', props: { href: '/hello', b: true }, children: [] });
});

test('two props with static values', () => {
  expect(htm`<a href="/hello" target="_blank" />`).toEqual({ tag: 'a', props: { href: '/hello', target: '_blank' }, children: [] });
});

test('single prop with dynamic value', () => {
  expect(htm`<a href=${'foo'} />`).toEqual({ tag: 'a', props: { href: 'foo' }, children: [] });
});

test('two props with dynamic values', () => {
  function onClick(e) { }
  expect(htm`<a href=${'foo'} onClick=${onClick} />`).toEqual({ tag: 'a', props: { href: 'foo', onClick }, children: [] });
});

test('prop with quoted dynamic value ignores static parts', () => {
  expect(htm`<a href="before${'foo'}after" a="b" />`).toEqual({ tag: 'a', props: { href: 'foo', a: 'b' }, children: [] });
});

test('spread props', () => {
  expect(htm`<a ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { foo: 'bar' }, children: [] });
  expect(htm`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b="1" ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: '1', foo: 'bar' }, children: [] });
  expect(htm`<a x="1"><b y="2" ...${{ c: 'bar' }}/></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2', c: 'bar' }) ));
  expect(htm`<a b=${2} ...${{ c: 3 }}>d: ${4}</a>`).toEqual(h('a',{ b: 2, c: 3 }, 'd: ', 4));
  expect(htm`<a ...${{ c: 'bar' }}><b ...${{ d: 'baz' }}/></a>`).toEqual(h('a', { c: 'bar' }, h('b', { d: 'baz' }) ));
});

test('multiple spread props in one element', () => {
  expect(htm`<a ...${{ foo: 'bar' }} ...${{ quux: 'baz' }} />`).toEqual({ tag: 'a', props: { foo: 'bar', quux: 'baz' }, children: [] });
});

test('mixed spread + static props', () => {
  expect(htm`<a b ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a b c ...${{ foo: 'bar' }} />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b />`).toEqual({ tag: 'a', props: { b: true, foo: 'bar' }, children: [] });
  expect(htm`<a ...${{ foo: 'bar' }} b c />`).toEqual({ tag: 'a', props: { b: true, c: true, foo: 'bar' }, children: [] });
});

test('closing tag', () => {
  expect(htm`<a></a>`).toEqual({ tag: 'a', props: null, children: [] });
  expect(htm`<a b></a>`).toEqual({ tag: 'a', props: { b: true }, children: [] });
});

test('auto-closing tag', () => {
  expect(htm`<a><//>`).toEqual({ tag: 'a', props: null, children: [] });
});

test('text child', () => {
  expect(htm`<a>foo</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
  expect(htm`<a>foo bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo bar'] });
  expect(htm`<a>foo "<b /></a>`).toEqual({ tag: 'a', props: null, children: ['foo "', { tag: 'b', props: null, children: [] }] });
});

test('dynamic child', () => {
  expect(htm`<a>${'foo'}</a>`).toEqual({ tag: 'a', props: null, children: ['foo'] });
});

test('mixed text + dynamic children', () => {
  expect(htm`<a>${'foo'}bar</a>`).toEqual({ tag: 'a', props: null, children: ['foo', 'bar'] });
  expect(htm`<a>before${'foo'}after</a>`).toEqual({ tag: 'a', props: null, children: ['before', 'foo', 'after'] });
  expect(htm`<a>foo${null}</a>`).toEqual({ tag: 'a', props: null, children: ['foo', null] });
});

test('element child', () => {
  expect(htm`<a><b /></a>`).toEqual(h('a', null, h('b', null)));
});

test('multiple element children', () => {
  expect(htm`<a><b /><c /></a>`).toEqual(h('a', null, h('b', null), h('c', null)));
  expect(htm`<a x><b y /><c z /></a>`).toEqual(h('a', { x: true }, h('b', { y: true }), h('c', { z: true })));
  expect(htm`<a x=1><b y=2 /><c z=3 /></a>`).toEqual(h('a', { x: '1' }, h('b', { y: '2' }), h('c', { z: '3' })));
  expect(htm`<a x=${1}><b y=${2} /><c z=${3} /></a>`).toEqual(h('a', { x: 1 }, h('b', { y: 2 }), h('c', { z: 3 })));
});

test('mixed typed children', () => {
  expect(htm`<a>foo<b /></a>`).toEqual(h('a', null, 'foo', h('b', null)));
  expect(htm`<a><b />bar</a>`).toEqual(h('a', null, h('b', null), 'bar'));
  expect(htm`<a>before<b />after</a>`).toEqual(h('a', null, 'before', h('b', null), 'after'));
  expect(htm`<a>before<b x=1 />after</a>`).toEqual(h('a', null, 'before', h('b', { x: '1' }), 'after'));
  expect(htm`
    <a>
      before
      ${'foo'}
      <b />
      ${'bar'}
      after
    </a>
  `).toEqual(h('a', null, 'before', 'foo', h('b', null), 'bar', 'after'));
});

test('hyphens (-) are allowed in attribute names', () => {
  expect(htm`<a b-c></a>`).toEqual(h('a', { 'b-c': true }));
});

test('NUL characters are allowed in attribute values', () => {
  expect(htm`<a b="\0"></a>`).toEqual(h('a', { b: '\0' }));
  expect(htm`<a b="\0" c=${'foo'}></a>`).toEqual(h('a', { b: '\0', c: 'foo' }));
});

test('NUL characters are allowed in text', () => {
  expect(htm`<a>\0</a>`).toEqual(h('a', null, '\0'));
  expect(htm`<a>\0${'foo'}</a>`).toEqual(h('a', null, '\0', 'foo'));
});

test('cache key should be unique', () => {
  htm`<a b="${'foo'}" />`;
  expect(htm`<a b="\0" />`).toEqual(h('a', { b: '\0' }));
  expect(htm`<a>${''}9aaaaaaaaa${''}</a>`).not.toEqual(htm`<a>${''}0${''}aaaaaaaaa${''}</a>`);
  expect(htm`<a>${''}0${''}aaaaaaaa${''}</a>`).not.toEqual(htm`<a>${''}.8aaaaaaaa${''}</a>`);
});

test('do not mutate spread variables', () => {
  const obj = {};
  htm`<a ...${obj} b="1" />`;
  expect(obj).toEqual({});
});

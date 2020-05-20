import './testfill.js'
import './hyperscript.js'
import './html.js'
import t from 'tst'
import { v } from '../index.js'
import h, { h as sh } from '../h.js'
// import h, { default as sh } from './libs/h21.js'
// import h, { default as sh } from './libs/h-compact.js'
// import h, { default as sh } from './libs/h-vm.js'
import { tick, frame, idle, time } from 'wait-please'
import observable from './libs/observable.js'



t('h: single attribute', async t => {
  const a = v(0)

  let el = h('div', { a })

  t.is(el.outerHTML, `<div a="0"></div>`)
  await tick(28)
  t.is(el.outerHTML, `<div a="0"></div>`)

  a(1)
  await tick(24)
  t.is(el.outerHTML, `<div a="1"></div>`)

  a(undefined)
  a[Symbol.dispose](null)
  await tick(24)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: single attribute on mounted node', async t => {
  const a = v(0)
  let div = document.createElement('div')

  let el = h(div, {a})

  t.is(el, div)
  t.is(el.outerHTML, `<div a="0"></div>`)
  await tick(28)
  t.is(el.outerHTML, `<div a="0"></div>`)

  a(1)
  // FIXME: why so big delay?
  await tick(24)
  t.is(el.outerHTML, `<div a="1"></div>`)

  a(undefined)
  a[Symbol.dispose]()
  await tick(24)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: text content', async t => {
  const a = v(0)

  let el = h('div', { }, a)

  t.is(el.outerHTML, `<div>0</div>`)
  await tick(8)
  t.is(el.outerHTML, `<div>0</div>`)

  a(1)
  await tick(8)
  t.is(el.outerHTML, `<div>1</div>`)

  a(undefined)
  a[Symbol.dispose]()
  await tick(8)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: child node', async t => {
  const text = v(0)
  const a = h('a', null, text)
  const b = h('b', null, a)

  t.is(b.outerHTML, `<b><a>0</a></b>`)

  text(1)
  await tick(8)
  t.is(b.outerHTML, `<b><a>1</a></b>`)
})

t('h: fragments / text', async t => {
  let a = h(document.createDocumentFragment(), null, `foo`, [`bar`])
  t.is(a.textContent, 'foobar')
  // let el2 = h(null, null, `foo`, [`bar`])
  // t.is(el2.textContent, 'foobar')
})

t('h: mixed static content', async t => {
  const foo = h('foo')
  const bar = `bar`
  const baz = h('baz')

  const a = h('a', null, ' ', foo, ' ', bar, ' ', baz, ' ')

  t.is(a.outerHTML, `<a> <foo></foo> bar <baz></baz> </a>`)
  await tick(28)
  t.is(a.outerHTML, `<a> <foo></foo> bar <baz></baz> </a>`)
})

t('h: dynamic list', async t => {
  const foo = h('foo')
  const bar = `bar`
  const baz = h('baz')
  const content = v()
  content([foo, bar, baz])

  const a = h('a', null, content)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)

  // content.push(`qux`)
  content([...content(), `qux`])
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz>qux</a>`)

  content().shift()
  content(content())
  await tick(8)
  t.is(a.outerHTML, `<a>bar<baz></baz>qux</a>`)

  content().length = 0
  content(content())
  await tick(8)
  t.is(a.outerHTML, `<a></a>`)

  content().push('x')
  content(content())
  t.is(a.outerHTML, `<a>x</a>`)
})

t('h: 2-level fragment', async t => {
  let w = h('x', null, ' ', h('y', null, ' '), ' ')
  t.is(w.outerHTML, `<x> <y> </y> </x>`)
  await tick(28)
  t.is(w.outerHTML, `<x> <y> </y> </x>`)
})

t('h: mount to another element', async t => {
  const a = h('a')
  const c = v(0)
  const b = h(a, null, c)

  t.is(a, b)
  t.is(b.outerHTML, `<a>0</a>`)
  await tick(8)
  t.is(b.outerHTML, `<a>0</a>`)
})

t('h: render new children to mounted element', async t => {
  let a = document.createElement('a')
  let el = h(a, null, 'foo ', h('bar', null, h('baz', {class: 'qux'})))
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
})

t('h: simple hydrate', async t => {
  let a = document.createElement('a')
  a.innerHTML = 'foo '
  let el = h(a, null, 'foo ', h('bar', null, h('baz', {class:'qux'})))
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
})

t('h: function renders external component', async t => {
  let el = h('a', null, 'foo ', h(bar))

  function bar () {
    return [h('bar'), h('baz')]
  }
  t.is(el.outerHTML, `<a>foo <bar></bar><baz></baz></a>`)
})

t('h: rerendering with props: must persist', async t => {
  let el = document.createElement('root')
  let div = document.createElement('div')

  h(el, null, div, h('x'))
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h(el, null, h(div), h('x'))
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h(el, null, h(div), h('x'))
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h(el, null, h('div'), h('x'))
  // t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)
  document.body.appendChild(h(el, null, h('div', {class:'foo', items:[]}), h('x')))
  // t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)
  t.is(el.firstChild.className, 'foo')
  t.is(el.firstChild.items, [])
})

t('h: should not lose attributes', async t => {
  let a = h('tr', {colspan:2})
  t.is(a.getAttribute('colspan'), "2")
})

t('h: reinsert self content', async t => {
  let el = document.createElement('div')
  el.innerHTML = 'a <b>c <d>e <f></f> g</d> h</b> i'

  let childNodes = [...el.childNodes]

  h(el, null, childNodes)

  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)

  await tick(28)
  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)
})

t.todo('h: changeable tag preserves/remounts children', async t => {
  let tag = state('a')
  let frag = h('', null, h(tag))
  t.is(frag.outerHTML, '<><a></a></>')
  await tick(8)
  t.is(frag.outerHTML, '<><a></a></>')
  tag('b')
  t.is(frag.outerHTML, '<><a></a></>')
  await tick(8)
  t.is(frag.outerHTML, '<><b></b></>')
  tag(null)
  await tick(8)
  t.is(frag.outerHTML, '<></>')
})

t('h: wrapping', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo/>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = h('div', null, h(foo, {class:'foo'}, h('bar')))

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('h: wrapping with children', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo><bar></bar><baz></baz></foo>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = h('div', null, h(foo, {class:'foo'}, ...foo.childNodes))

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar><baz></baz></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('h: input case', async t => {
  let el = h(document.createDocumentFragment(''), null, h('input'))
  t.is(el.outerHTML, `<><input></>`)
})

t('h: select case', async t => {
  const select = h('select', null, ' ', h('option', {value:'a'}), ' ')
  let w = h(document.createDocumentFragment(), null, ' ', select, ' ')
  await tick(8)
  t.is(w.outerHTML, `<> <select> <option value="a"></option> </select> </>`)
})

t('h: promises', async t => {
  let p = new Promise(ok => setTimeout(async () => {
    ok('123')
    await tick(8)
    t.is(el.outerHTML, '<div>123</div>')
    el.remove()
  }, 50))

  let el = document.createElement('div')
  document.body.appendChild(el)

  h(el, null, v(p))
  t.is(el.outerHTML, '<div></div>')

  return p
})

t('h: render to fragment', async t => {
  let frag = document.createDocumentFragment()
  let el = h(frag, null, 1)
  t.is(frag, el)
  t.is(el.outerHTML, '<>1</>')
  t.is(frag.outerHTML, '<>1</>')
})

t('h: observable', async t => {
  let v = observable(1)

  let el = h('div', {x: 1}, v)

  await tick(8)
  t.is(el.outerHTML, `<div x="1">1</div>`)
})

t.skip('h: generator', async t => {
  let el = html`<div>${ function* ({}) {
    yield 1
    yield 2
  }}</div>`
  await Promise.resolve().then()
  t.is(el.outerHTML, `<div>1</div>`)
  await Promise.resolve().then()
  t.is(el.outerHTML, `<div>2</div>`)
  // await Promise.resolve().then()
  // t.is(el.outerHTML, `<div>3</div>`)
})

t('h: async generator', async t => {
  let el = h('div', null, (async function* () {
    await tick(4)
    yield 1
    await tick(4)
    yield 2
    await tick(4)
  })())
  await tick(12)
  t.is(el.outerHTML, `<div>1</div>`)
  await tick(28)
  t.is(el.outerHTML, `<div>2</div>`)
})

t('h: put data directly to props', async t => {
  let x = {}
  let el = h('div', {x})
  t.is(el.x, x)
})

t('h: rerender real dom', async t => {
  let virt = h('div')
  let el = document.createElement('div')
  el.innerHTML = '<div></div>'
  let real = el.firstElementChild

  h(el, null, real)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  h(el, null, virt)
  // await tick(8)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)

  h(el, null, virt)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)

  h(el, null, real)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  h(el, null, virt)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)
})

t('h: preserve rendering target classes/ids/attribs', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.classList.add('x')
  el.id = 'x'
  el.x = '1'

  h(el, {id: 'y', class: 'x z w', w: 2})

  t.is(el.outerHTML, `<div x="1" class="x z w" id="y" w="2"></div>`)
  t.is(el.x, '1')
  t.is(el.w, 2)
})

t('h: does not duplicate classes for container', t => {
  let el = document.createElement('div')
  el.classList.add('x')
  h(el, {class: 'x'})
  t.is(el.outerHTML, '<div class="x"></div>')
})

t('h: component props', async t => {
  let log = []
  let el = h(C, {id: 'x', class:'y z'})

  function C (props) {
    log.push(props.id, props.class)
  }

  t.is(log, ['x', 'y z'])
})

t('h: observable in class', t => {
  let bar = v('')
  let el = h('div', {class: v([false, null, undefined, 'foo', bar])})
  t.is(el.outerHTML, `<div class="foo"></div>`)
  bar('bar')
  t.is(el.outerHTML, `<div class="foo bar"></div>`)
})

t('h: falsey prev attrs', t => {
  let el = h(`div`, { hidden:true })
  t.is(el.hidden, true)
  h(el, { hidden:false })
  t.is(el.hidden, false)
})

t('h: functional components create element', t => {
  let log = []
  let el = h(el => {
    let e = document.createElement('a')
    log.push(e)
    return e
  })
  t.is(log, [el])
})

t('h: must not morph inserted nodes', async t => {
  const foo = h('p', null, 'foo')
  const bar = h('p', null, 'bar')

  let el = h('div')

  h(el, null, foo)
  t.is(el.firstChild, foo, 'keep child')
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h(el, null, bar)
  t.is(el.firstChild, bar, 'keep child')
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h(el, null, foo)
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h(el, null, bar)
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
})

t('h: update own children', t => {
  let el = h('div', null, 123)
  h(el, null, [...el.childNodes])
  t.is(el.outerHTML, '<div>123</div>')
  h(el, null, el.childNodes)
  t.is(el.outerHTML, '<div>123</div>')
  h(el, null, ...el.childNodes)
  t.is(el.outerHTML, '<div>123</div>')
})

t('h: observable prop child', async t => {
  let obj = v()
  obj({ x: 1 })
  let el = h('div', null, v(obj, obj => obj.x))

  t.is(el.outerHTML, '<div>1</div>')

  obj({ x: 2 })
  await tick(8)
  t.is(el.outerHTML, '<div>2</div>')
})

t('h: null-like insertions', t => {
  let a = h('a', null, null, undefined, false, 0)

  t.is(a.innerHTML, 'false0')
})

t('h: hydrate by id with existing content', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a></a><b id="x"><x></x></b>'

  let el2 = h(el, null, h('b', {id: 'x'}))
  t.is(el2, el)
  t.is(el2.outerHTML, `<div><b id="x"></b></div>`)
})

t.skip('h: direct children', t => {
  // NOTE: this sugar slows down performance, no much sense
  let el1 = h('x', 1)
  t.is(el1.outerHTML, '<x>1</x>')

  let el2 = h('x', h('y'))
  t.is(el2.outerHTML, '<x><y></y></x>')

  let el3 = h('x', 'x')
  t.is(el3.outerHTML, '<x>x</x>')
})

t('h: array component', t => {
  let el = h(() => [1, 2])
  t.is(el.textContent, '12')
})

t('h: object props preserve internal observables, only high-levels are handled', async t => {
  let props, el = h('x', props = {x: v(0), y: v({x: v(1)})})
  t.is(el.outerHTML, `<x x="0"></x>`)
  t.is(el.y, props.y())
  t.is(el.y, {x: 1})
})

t('h: caching attr cases', async t => {
  let a = h('a', { x: 1 }, 'a', 6, 'b', 7, 'c')
  t.is(a.outerHTML, `<a x="1">a6b7c</a>`)
})

t('h: avoid multiple templates for children', async t => {
  let a1 = h('a', null, 'b', 'c')
  let a2 = h('a', null, 'b', 'c', 'd')
  t.is(a2.outerHTML, `<a>bcd</a>`)
  // console.log(h.cache)
})

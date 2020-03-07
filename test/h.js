import './hyperscript.js'

import t from 'tst'
import { $, state, fx, prop, h, list } from '../index.js'
// import { $, state, fx, prop, store, calc, list, ref, attr, on, html } from '../dist/spect.min.js'
import { tick, frame, idle, time } from 'wait-please'

t('h: single attribute', async t => {
  const a = state(0)

  let el = h('div', { a })

  t.is(el.outerHTML, `<div a="0"></div>`)
  await tick(28)
  t.is(el.outerHTML, `<div a="0"></div>`)

  a(1)
  await tick(24)
  t.is(el.outerHTML, `<div a="1"></div>`)

  a(undefined)
  a(null)
  await tick(24)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: single attribute on mounted node', async t => {
  const a = state(0)
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
  a(null)
  await tick(24)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: text content', async t => {
  const a = state(0)

  let el = h('div', { }, a)

  t.is(el.outerHTML, `<div>0</div>`)
  await tick(8)
  t.is(el.outerHTML, `<div>0</div>`)

  a(1)
  await tick(8)
  t.is(el.outerHTML, `<div>1</div>`)

  a(undefined)
  a(null)
  await tick(8)
  t.is(el.outerHTML, `<div></div>`)
})

t('h: child node', async t => {
  const text = state(0)
  const a = h('a', null, text)
  const b = h('b', null, a)

  t.is(b.outerHTML, `<b><a>0</a></b>`)

  text(1)
  await tick(8)
  t.is(b.outerHTML, `<b><a>1</a></b>`)
})

t('h: fragments / text', async t => {
  let el = h('', null, `foo`, [`bar`])
  t.is(el.textContent, 'foobar')
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
  const content = list([foo, bar, baz])

  const a = h('a', null, content)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)

  content.push(`qux`)
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz>qux</a>`)

  content.shift()
  await tick(8)
  t.is(a.outerHTML, `<a>bar<baz></baz>qux</a>`)

  content.length = 0
  await tick(8)
  t.is(a.outerHTML, `<a></a>`)

  content.push('x')
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
  const c = state(0)
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
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  h(el, null, h(div), h('x'))
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  h(el, null, h(div), h('x'))
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  h(el, null, h('div'), h('x'))
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  h(el, null, h('div', {class:'foo', items:[]}), h('x'))
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)
  t.equal(el.firstChild.className, 'foo')
  t.is(el.firstChild.items, [])
})

t('h: must not lose attributes', async t => {
  let a = html`<tr colspan=2/>`
  t.is(a.getAttribute('colspan'), "2")
})

t('h: reinsert self content', async t => {
  let el = document.createElement('div')
  el.innerHTML = 'a <b>c <d>e <f></f> g</d> h</b> i'

  let childNodes = [...el.childNodes]

  html`<${el}>${ childNodes }</>`

  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)

  await tick(28)
  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)
})

t('h: changeable tag preserves/remounts children', async t => {
  let tag = state('a')
  let frag = html`<><${tag}/></>`
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

  let wrapped = html`<div><${foo} class="foo"><bar/></></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('h: wrapping with children', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo><bar></bar><baz></baz></foo>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = html`<div><${foo} class=foo>${ [...foo.childNodes] }</></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar><baz></baz></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('h: select case', async t => {
  let w = html`<>
    <select>
      <option value="a"></option>
    </select>
  </>`
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

  html`<${el}>${p}</>`
  t.is(el.outerHTML, '<div></div>')

  return p
})

t('h: render to fragment', async t => {
  let frag = document.createDocumentFragment()
  let el = html`<${frag}>1</>`
  t.is(frag, el)
  t.is(el.outerHTML, '<>1</>')
  t.is(frag.outerHTML, '<>1</>')
})

t('h: observable', async t => {
  let v = observable(1)

  let el = html`<div x=1>${v}</div>`

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
  let el = html`<div>${(async function* () {
    await tick(4)
    yield 1
    await tick(4)
    yield 2
    await tick(4)
  })()}</div>`
  await tick(12)
  t.is(el.outerHTML, `<div>1</div>`)
  await tick(28)
  t.is(el.outerHTML, `<div>2</div>`)
})

t('h: put data directly to props', async t => {
  let x = {}
  let el = html`<div x=${x}/>`
  t.is(el.x, x)
})

t('h: rerender real dom', async t => {
  let virt = html`<div/>`
  let el = document.createElement('div')
  el.innerHTML = '<div></div>'
  let real = el.firstElementChild

  html`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  html`<${el}>${virt}</>`
  await tick(8)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  html`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  html`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  html`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)
})

t('h: preserve rendering target classes/ids/attribs', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.classList.add('x')
  el.id = 'x'
  el.x = '1'

  html`<${el} id="y" class="x z w" w=2/>`

  t.is(el.outerHTML, `<div x="1" class="x z w" id="y" w="2"></div>`)
  t.is(el.x, '1')
  t.is(el.w, '2')
})

t('h: does not duplicate classes for container', t => {
  let el = document.createElement('div')
  el.classList.add('x')
  html`<${el} class=x/>`
  t.is(el.outerHTML, '<div class="x"></div>')
})

t('h: multiple rendered observables', async t => {
  let a = state(0), b = state(1)

  let el = document.createElement('a')
  html`<${el}>${ a }</>`
  html`<${el}>${ b }</>`

  t.is(el.outerHTML, `<a>1</a>`)
  a(2)
  await tick(8)
  t.is(el.outerHTML, `<a>1</a>`)
  b(3)
  await tick(8)
  t.is(el.outerHTML, `<a>3</a>`)
})

t('h: legacy readme default', async t => {
  let div = document.createElement('div')

  html`<${div}><div id=id class=class foo=bar>baz</div></div>`

  t.is(div.outerHTML, '<div><div id="id" class="class" foo="bar">baz</div></div>')
  t.is(div.firstChild.foo, 'bar')
  t.is(div.firstChild.id, 'id')
})

t('h: attributes', t => {
  let div = document.createElement('div')

  html`<${div}><a href='/' foo=bar>baz</a></>`
  t.is(div.firstChild.outerHTML, '<a href="/" foo="bar">baz</a>')
  t.is(div.firstChild.foo, 'bar')
})

t('legacy h: component static props', async t => {
  let log = []
  let el = html`<div><${C} id="x" class="y z"/></>`

  function C (props) {
    log.push(props.id, props.class)
  }

  t.is(log, ['x', 'y z'])
})

t('h: classes must recognize false props', t => {
  let el = html`<div class="${false}${null}${undefined}${'foo'}${false}"/>`
  t.is(el.outerHTML, `<div class="foo"></div>`)
})

t('h: preserves hidden attribute', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div hidden></div>'

  let elr = html`<${el.firstChild} class="foo"/>`

  t.is(elr.outerHTML, '<div hidden="" class="foo"></div>')
  t.is(el.innerHTML, '<div hidden="" class="foo"></div>')
})

t('h: falsey prev attrs', t => {
  let el = html`<div hidden=${true}/>`
  t.is(el.hidden, true)
  html`<${el} hidden=${false}/>`
  t.is(el.hidden, false)
})

t('h: initial content should be morphed/hydrated', t => {
  let el = document.createElement('div')
  el.innerHTML = '<foo></foo><bar></bar>'
  let foo = el.firstChild
  let bar = el.lastChild

  const res = html`<${el}><foo/><bar/></>`

  t.equal(res, el)
  t.equal(el.childNodes.length, 2)
  t.equal(el.firstChild, foo)
  t.equal(el.lastChild, bar)

  let foo1 = html`<foo/>`
  html`<${el}>${foo1}<bar/></>`

  // t.notEqual(el.firstChild, foo)
  // t.equal(el.firstChild, foo1)
  t.equal(el.firstChild, foo)
  t.equal(el.lastChild, bar)
})

t('h: newline nodes should have space in between', t => {
  let el = html`<>
    ${'a'}
    ${'b'}
  </>`
  t.is(el.textContent, ' a b ')
})

t('legacy h: direct component rerendering should keep children', async t => {
  let el = html`<div><${fn}/></div>`
  let abc = el.firstChild

  t.is(el.outerHTML, '<div><abc></abc></div>')

  html`<${el}><${fn} class="foo"/></>`
  t.is(el.outerHTML, '<div><abc class="foo"></abc></div>')
  let abc1 = el.firstChild
  t.equal(abc1, abc)

  function fn () { return html`<abc/>` }
})

t('h: functional components create element', t => {
  let log = []
  let el = html`<${el => {
    let e = document.createElement('a')
    log.push(e)
    return e
  }}/>`
  t.is(log, [el])
})

t('h: assigned id must be accessible', async t => {
  let el = html`<x id=x1 />`
  t.is(el.id, 'x1')

  $(el, (el) => {
    t.is(el.id, 'x1')
    // t.is(props.id, 'x1')
  })
})

t('h: must update text content', async t => {
  const foo = html`foo`
  const bar = html`bar`

  let el = html`<div/>`

  html`<${el}>${ foo }</>`
  t.is(el.textContent, 'foo')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  html`<${el}>${ bar }</>`
  t.is(el.textContent, 'bar')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  html`<${el}>${ foo }</>`
  t.is(el.textContent, 'foo')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  html`<${el}>${ bar }</>`
  t.is(el.textContent, 'bar')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
})

t('h: must not morph inserted nodes', async t => {
  const foo = html`<p>foo</p>`
  const bar = html`<p>bar</p>`

  let el = html`<div/>`

  html`<${el}>${foo}</>`
  t.equal(el.firstChild, foo, 'keep child')
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  html`<${el}>${bar}</>`
  t.equal(el.firstChild, bar, 'keep child')
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  html`<${el}>${foo}</>`
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  html`<${el}>${bar}</>`
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
})

t('h: update own children', t => {
  let el = html`<div>123</div>`
  html`<${el}>${ el.childNodes }</>`
  t.is(el.outerHTML, '<div>123</div>')
})

t('h: externally assigned props must be available', async t => {
  let el = html`<x x=${1}/>`
  document.body.appendChild(el)
  $('x', (el) => {
    t.is(el.x, 1)
  })
})

t('h: streams must update values dynamically', async t => {
  let obj = { x: 1 }
  let el = html`<div>${ prop(obj, 'x') }</div>`

  t.is(el.outerHTML, '<div>1</div>')

  obj.x = 2
  await tick(8)
  t.is(el.outerHTML, '<div>2</div>')
})

t('h: direct value', async t => {
  let x = html`${1}`
  t.is(x.nodeType, 3)
})

t('h: insert nodes list', t => {
  let el = document.createElement('div')
  el.innerHTML = '|bar <baz></baz>|'

  let orig = [...el.childNodes]

  html`<${el}><div class="prepended" /> foo ${ el.childNodes } qux <div class="appended" /></>`
  t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)

  html`<${el}>foo ${ orig } qux</>`
  t.equal(el.innerHTML, `foo |bar <baz></baz>| qux`)

  html`<${el}><div class="prepended" /> foo ${ orig } qux <div class="appended" /></>`
  t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)
})

t('legacy h: handle collections', t => {
  // prepend icons to buttons
  let b = document.body.appendChild(document.createElement('button'))
  b.innerHTML = 'Click <span>-</span>'
  b.setAttribute('icon', 'phone_in_talk')
  let content = b.childNodes

  html`<${b}><i class="material-icons">${ b.getAttribute('icon') }</i> ${ content }</>`

  t.equal(b.innerHTML, '<i class="material-icons">phone_in_talk</i> Click <span>-</span>')
  document.body.removeChild(b)
})

t('h: insert self/array of nodes', t => {
  let el = document.createElement('div')
  let a1 = document.createElement('a')
  let a2 = document.createElement('a')
  a1.id = 'x'
  a2.id = 'y'
  html`<${el}>${[ a1, a2 ]}</>`
  t.equal(el.innerHTML, `<a id="x"></a><a id="y"></a>`)
})

t('h: functional insertions', async t => {
  const c = state(0)
  let i = 0, j = 0
  const log = []
  let el = html`<a foo=${ip => (log.push(ip), i++)} c=${c}>${jp => (log.push(jp), j++)}</a>`

  t.is(el.outerHTML, `<a foo="0" c="0">0</a>`)
  t.is(i, 1, 'prop fn is called once')
  t.is(j, 1, 'content fn is called once')
  t.is(log, [undefined, undefined], 'prev values')
})

t.todo('legacy h: re-rendering inner nodes shouldn\'t trigger mount callback', async t => {
  let log = []
  let $a = html`<div.a><div.b use=${fn}/></>`
  document.body.appendChild($a[0])

  function fn ({ mount }) {
    log.push(0)
    mount(() => {
      log.push(1)
      return () => log.push(2)
    })
  }

  await $a
  t.is(log, [0, 1])

  $a.html``
  await $a
  t.is(log, [0, 1, 2])

  $a.html`<div.b use=${fn}/>`
  await $a
  t.is(log, [0, 1, 2, 0, 1])

  $a.html``
  await $a
  t.is(log, [0, 1, 2, 0, 1, 2])
})

t.todo('h: nested fragments', t => {
  let el = html`<><a>a</a><b><>b<c/></></b></>`
  t.equal(el.outerHTML, '<><a>a</a><b>b<c></c></b></>')
})

t.skip('h: class components', async t => {
  // doesn't seem like registering web-component is spect's concern
})

t('h: null-like insertions', t => {
  let a = html`<a>foo ${ null } ${ undefined } ${ false } ${0}</a>`

  t.is(a.innerHTML, 'foo   false 0')

  let b = html`${ null } ${ undefined } ${ false } ${0}`
  t.is(b.map(e => e.textContent).join(''), '  false 0')
  let c = html``
  t.is(c.textContent, '')
})

t('h: 50+ elements shouldnt invoke recursion', t => {
  let data = Array(100).fill({x:1})

  let el = html`${ data.map(item => html`<${fn} ...${item}/>`) }`

  function fn ({x}) {
    return html`x: ${x}`
  }

  t.is(el[2].textContent, 'x: ')
  t.ok(el.length >= 100, 'many els created')
})


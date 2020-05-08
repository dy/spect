import t from 'tst'
import { v, $ } from '../index.js'
import h from '../h.js'
import { tick, frame, idle, time } from 'wait-please'
import observable from './libs/observable.js'
// import { v as iv } from 'ironjs'


t.only('html: fast simple case', async t => {
  let el = h`<div class=${'hello'} a><h1 id=${'hello'}>${'Hello World'}!</h1></div>`
  t.is(el.outerHTMLClean, `<div class="hello" a=""><h1 id="hello">${'Hello World'}!</h1></div>`)
})

t('html: direct attribute case', async t => {
  let el = h`<div a=0 b=${1}/>`
  t.is(el.outerHTMLClean, `<div a="0" b="1"></div>`, 'simple attr')
})

t('html: multifield attr case', t => {
  let el = h`<div a=a${'b'}c${'d'} class="a ${'b'} c"/>`
  t.is(el.outerHTML, `<div a="abcd" class="a b c"></div>`, 'multifield')
})

t('html: observable attr', t => {
  // observable name
  const a = v('a')
  el = h`<div ${a}/>`
  t.is(el.outerHTML, `<div a=""></div>`, 'observable name')

  // observable value
  const val = v(0)
  el = h`<div a=${val}></div>`
  t.is(el.outerHTML, `<div a="0"></div>`, 'observable value')

  val(1)
  t.is(el.outerHTML, `<div a="1"></div>`, 'changed observable value')

  val(null)
  t.is(el.outerHTML, `<div></div>`, 'null value')

  val[Symbol.dispose]()
  t.is(el.outerHTML, `<div></div>`, 'disposed')
})

t('html: single attribute on mounted node', async t => {
  const a = v(0)
  let div = document.createElement('div')

  h`<${div} a=${a}></>`

  // t.is(el, div)
  t.is(div.outerHTML, `<div a="0"></div>`)
  await tick(28)
  t.is(div.outerHTML, `<div a="0"></div>`)

  a(1)
  await tick(24)
  t.is(div.outerHTML, `<div a="1"></div>`)
  a(null)
  await tick(24)
  t.is(div.outerHTML, `<div></div>`)
})

t('html: creation perf case', t => {
  for (let i = 0; i < 2; i++) {
    h`<a>a<b><c>${i}</c></b></a>`
  }
  t.is(h`<a>a<b><c>${0}</c></b></a>`.outerHTML, `<a>a<b><c>0</c></b></a>`)
  t.is(h`<a>a<b><c>${1}</c></b></a>`.outerHTML, `<a>a<b><c>1</c></b></a>`)
})

t('html: observable text content', async t => {
  const a = v(0)

  let el = h`<div>${ a }</div>`

  t.is(el.outerHTML, `<div>0</div>`)
  await tick(8)
  t.is(el.outerHTML, `<div>0</div>`)

  a(1)
  await tick(8)
  t.is(el.outerHTML, `<div>1</div>`)

  a(undefined)
  await tick(8)
  t.is(el.outerHTML, `<div></div>`)
})

t('html: child node', async t => {
  const text = v(0)
  const a = h`<a>${ text }</a>`
  const b = h`<b>${ a }</b>`

  t.is(b.outerHTML, `<b><a>0</a></b>`)
  t.is(b.firstChild, a, 'b > a')

  text(1)
  await tick(8)
  t.is(a.outerHTML, `<a>1</a>`)
  t.is(b.outerHTML, `<b><a>1</a></b>`)
})

t('html: mixed static content', async t => {
  const foo = h`<foo></foo>`
  const bar = `bar`
  const baz = h`<baz/>`

  const a = h`<a> ${foo} ${bar} ${baz} </a>`

  t.is(a.outerHTML, `<a> <foo></foo> bar <baz></baz> </a>`)
})

t('html: dynamic list', async t => {
  const foo = h`<foo></foo>`
  const bar = `bar`
  const baz = h`<baz/>`
  const content = v()
  content([foo, bar, baz])

  const a = h`<a>${ content }</a>`
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)

  content().push(h`qux`)
  content(content())
  await tick(8)
  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz>qux</a>`)

  content().shift()
  content(content())
  await tick(8)
  t.is(a.outerHTML, `<a>bar<baz></baz>qux</a>`, 'shift')

  content().length = 0
  content(content())
  await tick(8)
  t.is(a.outerHTML, `<a></a>`)
})

t('html: 2-level fragment', async t => {
  let w = h`<x> <y> </y> </x>`
  t.is(w.outerHTML, `<x> <y> </y> </x>`)
  await tick(28)
  t.is(w.outerHTML, `<x> <y> </y> </x>`)
})

t('html: 2-level attribs', async t => {
  let x = v(0)
  let el = h`<a><b x=${x}/></a>`
  t.is(el.outerHTML, `<a><b x="0"></b></a>`)
})

t('html: mount to another element', async t => {
  const a = h`<a></a>`
  const c = v(0)
  const b = h`<${a}>${ c }</>`

  t.is(a, b)
  t.is(a.outerHTML, `<a>0</a>`)
  await tick(8)
  t.is(b.outerHTML, `<a>0</a>`)
})

t('html: simple hydrate', async t => {
  let a = document.createElement('a')
  a.innerHTML = 'foo '
  let el = h`<${a}>foo <bar><baz class="qux"/></></>`
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
  t.is(el.firstChild, a.firstChild)
})

t('html: simple hydrate with insertion', async t => {
  let a = document.createElement('a')
  a.innerHTML = 'foo '
  let el = h`<${a}>foo <bar>${ h`<baz class="qux"/>` }</></>`
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
  t.is(el.firstChild, a.firstChild)
})

t('html: function renders external component', async t => {
  let el = h`<a>foo <${bar}/></a><b/>`
  function bar () {
    return h`<bar/><baz/>`
  }
  t.is(el.outerHTML, `<><a>foo <bar></bar><baz></baz></a><b></b></>`)
  // t.is(el[1].outerHTML, `<b></b>`)
})
t.skip('html: element should be observable', async t => {
  // NOTE: Observable support is dropped - no much use
  let a = v(1)
  let el = h`<a>${a}</a>`
  let log = []
  v(el)(el => log.push(el.textContent))
  a(2)
  t.is(log, ['1', '2'])
})

t('html: rerendering with props: must persist', async t => {
  let el = document.createElement('x')
  let div = document.createElement('div')

  h`<${el}>${div}<x/></>`
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2, 'children number')

  h`<${el}><${div}/><x/></>`
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h`<${el}><${div}/><x/></>`
  t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h`<${el}><div/><x/></>`
  // FIXME: this is being cloned by preact
  // t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)

  h`<${el}><div class="foo" items=${[]}/><x/></>`
  // t.is(el.firstChild, div)
  t.is(el.childNodes.length, 2)
  t.is(el.firstChild.className, 'foo')
  t.is(el.firstChild.items, [])
})

t('html: must not lose attributes', async t => {
  let a = h`<tr colspan=2/>`
  t.is(a.getAttribute('colspan'), "2")
})

t('html: fragments', async t => {
  let el = h`<foo/><bar/>`
  t.is(el.outerHTML, `<><foo></foo><bar></bar></>`)

  // let el2 = h`<>foo</>`
  // t.is(el2.textContent, 'foo')

  let el3 = h`foo`
  t.is(el3.textContent, 'foo')
})

t('html: reinsert self content', async t => {
  let el = document.createElement('div')
  el.innerHTML = 'a <b>c <d>e <f></f> g</d> h</b> i'

  let childNodes = [...el.childNodes]

  h`<${el}>${ childNodes }</>`

  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)

  await tick(28)
  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)
})

t('html: wrapping', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo/>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = h`<div><${foo} class="foo"><bar/></></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('html: wrapping with children', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo><bar></bar><baz></baz></foo>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = h`<div><${foo} class=foo>${ [...foo.childNodes] }</></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar><baz></baz></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('html: select case', async t => {
  let w = h`<select><option value="a"></option></select>`
  await tick(8)
  t.is(w.outerHTML, `<select><option value="a"></option></select>`)
})

t('html: promises', async t => {
  let p = new Promise(ok => setTimeout(async () => {
    ok('123')
    await tick(8)
    t.is(el.outerHTML, '<div>123</div>')
    el.remove()
  }, 50))

  let el = document.createElement('div')
  document.body.appendChild(el)

  h`<${el}>${v(p)}</>`
  t.is(el.outerHTML, '<div></div>')

  return p
})

t('html: render to fragment', async t => {
  let frag = document.createDocumentFragment()
  let el = h`<${frag}>1</>`
  // t.is(frag, el)
  // t.is(el.outerHTML, '<></>')
  t.is(frag.outerHTML, '<>1</>')
})

t('html: observable', async t => {
  let v = observable(1)

  let el = h`<div x=1>${v}</div>`

  await tick(8)
  t.is(el.outerHTML, `<div x="1">1</div>`)
})

t.skip('html: generator', async t => {
  let el = h`<div>${ function* ({}) {
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

t('html: async generator', async t => {
  let el = h`<div>${(async function* () {
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

t('html: put data directly to props', async t => {
  let x = {}
  let el = h`<div x=${x}/>`
  t.is(el.x, x)
})

t('html: rerender real dom', async t => {
  let virt = h`<div/>`
  let el = document.createElement('div')
  el.innerHTML = '<div></div>'
  let real = el.firstElementChild

  h`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  h`<${el}>${virt}</>`
  await tick(8)
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)

  h`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)

  h`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, real)

  h`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstElementChild, virt)
})

t('html: preserve rendering target classes/ids/attribs', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.classList.add('x')
  el.id = 'x'
  el.x = '1'

  h`<${el} id="y" class="x z w" w=2/>`

  t.is(el.outerHTML, `<div x="1" class="x z w" id="y" w="2"></div>`)
  t.is(el.x, '1')
  t.is(el.w, '2')
})

t('html: does not duplicate classes for container', t => {
  let el = document.createElement('div')
  el.classList.add('x')
  h`<${el} class=x/>`
  t.is(el.outerHTML, '<div class="x"></div>')
})

t.skip('html: component static props', async t => {
  let log = []
  let el = h`<div><${C} id="x" class="y z"/></>`

  function C (props) {
    log.push(props.id, props.class)
  }

  t.is(log, ['x', 'y z'])
})

t('html: classes must recognize false props', t => {
  let el = h`<div class="${false} ${null} ${undefined} ${'foo'} ${false}"/>`
  t.is(el.outerHTML, `<div class="foo"></div>`)
})

t('html: preserves hidden attribute / parent', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div hidden></div>'

  let elr = h`<${el.firstChild} class="foo"/>`

  t.is(elr.outerHTML, '<div hidden="" class="foo"></div>')
  t.is(el.innerHTML, '<div hidden="" class="foo"></div>')
})

t('html: falsey prev attrs', t => {
  let el = h`<div hidden=${true}/>`
  t.is(el.hidden, true)
  h`<${el} hidden=${false}/>`
  t.is(el.hidden, false)
})

t('html: initial content should be morphed/hydrated', t => {
  let el = document.createElement('div')
  el.innerHTML = '<foo></foo><bar></bar>'
  let foo = el.firstChild
  let bar = el.lastChild

  const res = h`<${el}><foo/><bar/></>`

  t.is(res, el)
  t.is(el.childNodes.length, 2)
  // t.is(el.firstChild, foo)
  // t.is(el.lastChild, bar)

  let foo1 = h`<foo/>`
  h`<${el}>${foo1}<bar/></>`

  // t.notEqual(el.firstChild, foo)
  // t.is(el.firstChild, foo1)
  t.is(el.firstChild, foo1)
  // t.is(el.lastChild, bar)
})

t('html: newline nodes should have space in between, but not around', t => {
  let el = h` ${'a'} ${'b'} `
  t.is(el.textContent, 'a b')
})

t('html: direct component rerendering should keep children', async t => {
  let el = h`<div><${fn}/></div>`
  let abc = el.firstChild

  t.is(el.outerHTML, '<div><abc></abc></div>')

  h`<${el}><${fn} class="foo"/></>`
  t.is(el.outerHTML, '<div><abc class="foo"></abc></div>')
  // let abc1 = el.firstChild
  // t.is(abc1, abc)

  function fn ({children, ...props}) {return h`<abc ...${props}/>` }
})

t('html: functional components create element', t => {
  let log = []
  let el = h`<${el => {
    let e = document.createElement('a')
    log.push(e)
    return e
  }}/>`
  t.is(log, [el])
})

t('html: must update text content', async t => {
  const foo = h`foo`
  const bar = h`bar`

  let el = h`<div/>`

  h`<${el}>${ foo }</>`
  t.is(el.textContent, 'foo')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  h`<${el}>${ bar }</>`
  t.is(el.textContent, 'bar')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  h`<${el}>${ foo }</>`
  t.is(el.textContent, 'foo')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
  h`<${el}>${ bar }</>`
  t.is(el.textContent, 'bar')
  t.is(foo.textContent, 'foo')
  t.is(bar.textContent, 'bar')
})

t('html: must not morph inserted nodes', async t => {
  const foo = h`<p>foo</p>`
  const bar = h`<p>bar</p>`

  let el = h`<div/>`

  h`<${el}>${foo}</>`
  t.is(el.firstChild, foo, 'keep child')
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h`<${el}>${bar}</>`
  t.is(el.firstChild, bar, 'keep child')
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h`<${el}>${foo}</>`
  t.is(el.innerHTML, '<p>foo</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
  h`<${el}>${bar}</>`
  t.is(el.innerHTML, '<p>bar</p>')
  t.is(foo.outerHTML, '<p>foo</p>')
  t.is(bar.outerHTML, '<p>bar</p>')
})

t('html: update own children', t => {
  let el = h`<div>123</div>`
  h`<${el}>${ el.childNodes }</>`
  t.is(el.outerHTML, '<div>123</div>')
})

t('html: [legacy] prop', async t => {
  let obj = v(() => ({ x: 1 }))
  let el = h`<div>${ v(obj, obj => obj.x) }</div>`

  t.is(el.outerHTML, '<div>1</div>')

  obj({x: 2})
  await tick(8)
  t.is(el.outerHTML, '<div>2</div>')
})

t('html: direct value', async t => {
  let x = h`${1}`
  t.is(x.nodeType, 3)
})

t('html: insert nodes list', t => {
  let el = document.createElement('div')
  el.innerHTML = '|bar <baz></baz>|'

  let orig = [...el.childNodes]

  h`<${el}><div class="prepended" /> foo ${ el.childNodes } qux <div class="appended" /></>`
  t.is(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)

  h`<${el}>foo ${ orig } qux</>`
  t.is(el.innerHTML, `foo |bar <baz></baz>| qux`)

  h`<${el}><div class="prepended" /> foo ${ orig } qux <div class="appended" /></>`
  t.is(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)
})

t('legacy html: handle collections', t => {
  // prepend icons to buttons
  let b = document.body.appendChild(document.createElement('button'))
  b.innerHTML = 'Click <span>-</span>'
  b.setAttribute('icon', 'phone_in_talk')
  let content = b.childNodes

  h`<${b}><i class="material-icons">${ b.getAttribute('icon') }</i> ${ content }</>`
  t.is(b.innerHTML, '<i class="material-icons">phone_in_talk</i> Click <span>-</span>')
  document.body.removeChild(b)
})

t('html: insert self/array of nodes', t => {
  let el = document.createElement('div')
  let a1 = document.createElement('a')
  let a2 = document.createElement('a')
  a1.id = 'x'
  a2.id = 'y'
  h`<${el}>${[ a1, a2 ]}</>`
  t.is(el.innerHTML, `<a id="x"></a><a id="y"></a>`)
})

t.todo('legacy html: re-rendering inner nodes shouldn\'t trigger mount callback', async t => {
  let log = []
  let $a = h`<div.a><div.b use=${fn}/></>`
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

  $a.h``
  await $a
  t.is(log, [0, 1, 2])

  $a.h`<div.b use=${fn}/>`
  await $a
  t.is(log, [0, 1, 2, 0, 1])

  $a.h``
  await $a
  t.is(log, [0, 1, 2, 0, 1, 2])
})

t.todo('html: nested fragments', t => {
  let el = h`<><a>a</a><b><>b<c/></></b></>`
  t.is(el.outerHTML, '<><a>a</a><b>b<c></c></b></>')
})

t.skip('html: class components', async t => {
  // doesn't seem like registering web-component is spect's concern
})

t('html: null-like insertions', t => {
  let a = h`<a>foo ${ null } ${ undefined } ${ false } ${0}</a>`

  t.is(a.innerHTML, 'foo   false 0')

  let b = h`${ null } ${ undefined } ${ false } ${0}`
  t.is(b.textContent, '  false 0')
  let c = h``
  t.is(c.textContent, '')
})

t.todo('html: component siblings', t => {
  let a = h`<x/> ${1}`
})

t('html: non-observables create flat string', t => {
  let b = h`1 ${2} <${() => 3}/> ${[4, ' ', h`5 ${6}`]}`
  t.is(b.textContent, `1 2 3 4 5 6`)

  let c = h`1 ${v(2)} 3`
  t.is(c.textContent, `1 2 3`)
})

t('html: recursion case', t => {
  let el = h`${ [h`<${fn} x=1/>`] }`

  function fn ({x}) {
    return h`x: ${x}`
  }

  t.is(el.textContent, `x: 1`)
})

t('html: 50+ elements shouldnt invoke recursion', t => {
  let data = Array(100).fill({x:1})

  let el = h`${ data.map(item => h`<${fn} ...${item}/>`) }`

  function fn ({x}) {
    return h`x: ${x}`
  }

  t.is(el.childNodes[0].textContent, 'x: ')
  t.ok(el.childNodes.length >= 100, 'many els created')
})

t.skip('html: iron support', t => {
  const noun = iv('world')
  const message = iv(() => `Hello ${noun.v}`)

  let el = h`<x>${v(message)}</x>`
  t.is(el.outerHTML, `<x>Hello world</x>`)

  noun.v = 'Iron'
  t.is(el.outerHTML, `<x>Hello Iron</x>`)
})

t('html: empty children should clean up content', t => {
  let a = h`<div><a/><a/></div>`
  t.is(a.childNodes.length, 2)
  h`<${a}></>`
  t.is(a.childNodes.length, 0)
})

t.todo('html: multiple attr fields', async t => {
  let a = h`<a x=1 ${'y'}=2 z=${3} ${'w'}=${4} ...${{_: 5}}>a${ 6 }b${ 7 }c</a>`
  t.is(a.outerHTML, `<a x="1" z="3" y="2" w="4" _="5">a6b7c</a>`)
})
t('html: caching fields', async t => {
  let a = h`<a x=1 ${'y'}=2 z=${3} ...${{_: 5}}>a${ 6 }b${ 7 }c</a>`
  t.is(a.outerHTML, `<a x="1" z="3" y="2" _="5">a6b7c</a>`)
})

t('html: a#b.c', async t => {
  let el = h`<a#b><c.d/></a><a/>`
  t.is(el.outerHTML, `<><a id="b"><c class="d"></c></a><a></a></>`)
})

t.todo('html: non-tr > td elements must persist', async t => {
  let el = document.createElement('tr')
  h`<${el}><td>${1}</td></>`
  t.is(el.outerHTML, `<tr><td>1</td></tr>`)
})

t('html: dynamic data case', async t => {
  let table = document.createElement('table'), data = v(() => [])
  h`<${table}>${ v(data, data => data.map(item => h`<tr><td>${ item }</td></tr>`)) }</>`
  t.is(table.innerHTML, '')

  console.log('---update')
  data([1])
  t.is(table.innerHTML, '<tr><td>1</td></tr>')
})

t('html: fields order', async t => {
  t.is(h`<b> b${2}b <c>c${3}c</c> b${4}b </b> `.outerHTML, `<b> b2b <c>c3c</c> b4b </b>`)
})

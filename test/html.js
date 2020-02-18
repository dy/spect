import t from 'tst'
import { $, state, fx, prop, store, calc, list, ref, attr, on, html } from '../index.js'
import { tick, frame, idle, time } from 'wait-please'
import { augmentor, useState, useEffect, useMemo } from 'augmentor'
import Observable from 'zen-observable/esm'
import observable from './observable.js'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let s = '<>'
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML
    })
    s+='</>'
    return s
  }
})

t('html: single attribute', async t => {
  const a = state(0)

  let el = html`<div a=${a}></div>`

  // await tick(8)
  t.is(el.outerHTML, `<div a="0"></div>`)

  a(1)
  await tick(8)
  t.is(el.outerHTML, `<div a="1"></div>`)

  a(null)
  await tick(8)
  t.is(el.outerHTML, `<div></div>`)
})

t('html: text content', async t => {
  const a = state(0)

  let el = html`<div>${ a }</div>`

  t.is(el.outerHTML, `<div>0</div>`)

  a(1)
  await tick(8)
  t.is(el.outerHTML, `<div>1</div>`)

  a(null)
  await tick(8)
  t.is(el.outerHTML, `<div></div>`)
})

t('html: child node', async t => {
  const text = state(0)
  const a = html`<a>${ text }</a>`
  const b = html`<b>${ a }</b>`

  t.is(b.outerHTML, `<b><a>0</a></b>`)

  text(1)
  await tick(8)
  t.is(b.outerHTML, `<b><a>1</a></b>`)
})

t('html: mixed static content', async t => {
  const foo = html`<foo></foo>`
  const bar = `bar`
  const baz = html`<baz/>`

  const a = html`<a> ${foo} ${bar} ${baz} </a>`

  t.is(a.outerHTML, `<a> <foo></foo> bar <baz></baz> </a>`)
})

t('html: dynamic list', async t => {
  const foo = html`<foo></foo>`
  const bar = `bar`
  const baz = html`<baz/>`
  const content = list([foo, bar, baz])

  const a = html`<a>${ content }</a>`

  t.is(a.outerHTML, `<a><foo></foo>bar<baz></baz></a>`)
})

t('html: 2-level fragment', async t => {
  let w = html`<> <x> <y> </y> </x> </>`
  await tick(8)
  t.is(w.outerHTML, `<> <x> <y> </y> </x> </>`)
})

t('html: mount to another element', async t => {
  const a = html`<a></a>`
  const c = state(0)
  const b = html`<${a}>${ c }</>`

  t.is(a, b)
  t.is(b.outerHTML, `<a>0</a>`)
})

t('html: render new children to mounted element', async t => {
  let a = document.createElement('a')
  let el = html`<${a}>foo <bar><baz class="qux"/></></>`
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
})

t.skip('html: function renders external component', async t => {
  let el = html`<a>foo <${bar}/></><b/>`

  function bar () {
    return html`<bar/><baz/>`
  }

  t.is(el.firstChild.outerHTML, `<a>foo <bar></bar><baz></baz></a>`)
  t.is(el.lastChild.outerHTML, `<b></b>`)
})

t.skip('html: rerendering with props: must persist', async t => {
  let el = document.createElement('x')
  let div = document.createElement('div')

  html`<${el}>${div}<x/></>`
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><${div}/><x/></>`
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><${div}/><x/></>`
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><div/><x/></>`
  // FIXME: this is being cloned by preact
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><div class="foo" items=${[]}/><x/></>`
  t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)
  t.equal(el.firstChild.className, 'foo')
  t.is(el.firstChild.items, [])
})

t('html: must not lose attributes', async t => {
  let a = html`<tr colspan=2/>`
  t.is(a.getAttribute('colspan'), "2")
})

t('html: fragments', async t => {
  let el = html`<foo/><bar/>`
  t.is(el.length, 2)

  let el2 = html`<>foo</>`
  t.is(el2.textContent, 'foo')

  let el3 = html`foo`
  t.is(el3.textContent, 'foo')
})

t('html: reinsert self content', t => {
  let el = document.createElement('div')
  el.innerHTML = 'a <b>c <d>e <f></f> g</d> h</b> i'

  let childNodes = [...el.childNodes]

  html`<${el}>${ childNodes }</>`

  t.is(el.outerHTML, `<div>a <b>c <d>e <f></f> g</d> h</b> i</div>`)
})

t('html: wrapping', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo/>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = html`<div><${foo} class="foo"><bar/></></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('html: wrapping with children', async t => {
  let root = document.createElement('div')
  root.innerHTML = '<foo><bar></bar><baz></baz></foo>'
  let foo = root.firstChild
  foo.x = 1

  let wrapped = html`<div><${foo} class=foo>${ [...foo.childNodes] }</></div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar><baz></baz></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('html: select case', async t => {
  let w = html`<>
    <select>
      <option value="a"></option>
    </select>
  </>`
  await tick(8)
  t.is(w.outerHTML, `<> <select> <option value="a"></option> </select> </>`)
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

  html`<${el}>${p}</>`
  t.is(el.outerHTML, '<div></div>')

  return p
})

t('html: render to fragment', async t => {
  let frag = document.createDocumentFragment()
  html`<${frag}>1</>`
  t.is(frag.outerHTML, '<>1</>')
})

t('html: observable', async t => {
  let v = observable(1)

  let el = html`<div x=1>${v}</div>`

  await tick(8)
  t.is(el.outerHTML, `<div x="1">1</div>`)
})

t.skip('html: generator', async t => {
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

t('html: async generator', async t => {
  let el = html`<div>${async function* () {
    await tick(4)
    yield 1
    await tick(4)
    yield 2
    await tick(4)
  }}</div>`
  await tick(8)
  t.is(el.outerHTML, `<div>1</div>`)
  await tick(8)
  t.is(el.outerHTML, `<div>2</div>`)
})

t('html: put data directly to props', async t => {
  let x = {}
  let el = html`<div x=${x}/>`
  t.is(el.x, x)
})

t.skip('html: rerender real dom', t => {
  let real = document.createElement('div')
  let virt = html`<div/>`
  let el = document.createElement('div')
  el.innerHTML = '<div></div>'

  html`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstChild, real)

  html`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstChild, real)

  html`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstChild, real)

  html`<${el}>${real}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstChild, real)

  html`<${el}>${virt}</>`
  t.is(el.outerHTML, '<div><div></div></div>')
  t.is(el.firstChild, real)
})

t.skip('html: preserve rendering target classes/ids/attribs', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.classList.add('x')
  el.id = 'x'

  html`<${el}#y.z.w w=2/>`

  t.is(el.outerHTML, `<div x="1" class="x z w" id="y" w="2"></div>`)
  t.is(el.x, '1')
  t.is(el.w, '2')
})

t('html: does not duplicate classes for container', t => {
  let el = document.createElement('div')
  el.classList.add('x')
  html`<${el} class=x/>`
  t.is(el.outerHTML, '<div class="x"></div>')
})

t.todo('html: secondary rendering must dispose previous effects')

t.todo('html: mapped list rendering case')

t('legacy html: readme default', async t => {
  let div = document.createElement('div')

  html`<${div}><div id=id class=class foo=bar>baz</div></div>`

  t.is(div.outerHTML, '<div><div id="id" class="class" foo="bar">baz</div></div>')
  t.is(div.firstChild.foo, 'bar')
  t.is(div.firstChild.id, 'id')
})

t('legacy html: attributes', t => {
  let div = document.createElement('div')

  html`<${div}><a href='/' foo=bar>baz</a></>`
  t.is(div.firstChild.outerHTML, '<a href="/" foo="bar">baz</a>')
  t.is(div.firstChild.foo, 'bar')
})

t.skip('legacy html: component static props', async t => {
  let log = []
  let el = html`<div><${C}#x.y.z/></>`

  function C (e) {
    let [element] = e
    log.push(element.tagName, element.id, element.className)
  }

  await Promise.resolve()
  t.is(log, ['C-0', 'x', 'y z'])
})

t('html: classes must recognize false props', t => {
  let el = html`<div class="${false}${null}${undefined}${'foo'}${false}"/>`
  t.is(el.outerHTML, `<div class="foo"></div>`)
})

t('html: preserves hidden attribute', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div hidden></div>'

  html`<${el.firstChild} class="foo"/>`

  t.is(el.innerHTML, '<div hidden="" class="foo"></div>')
})

t('html: falsey prev attrs', t => {
  let el = html`<div hidden=${true}/>`
  t.is(el.hidden, true)
  html`<${el} hidden=${false}/>`
  t.is(el.hidden, false)
})

t.todo('html: initial content should be morphed/hydrated', t => {
  let el = document.createElement('div')
  el.innerHTML = '<foo></foo><bar></bar>'
  let foo = el.firstChild
  let bar = el.lastChild

  const res = html`<${el}><foo/><bar/></>`

  t.equal(res, el)
  t.equal(el.childNodes.length, 2)
  t.equal(el.firstChild, foo)
  t.equal(el.lastChild, bar)

  // let foo1 = html`<foo/>`
  // html`<${el}>${foo1}<bar/></>`

  // t.notEqual(el.firstChild, foo)
  // t.equal(el.firstChild, foo1)
  // t.equal(el.lastChild, bar)
})

t.todo('html: newline nodes should have space in between', t => {
  let el = html`
    ${'a'}
    ${'b'}
  `
  t.is(el.textContent, 'a b')
})

t.todo('legacy html: direct component rerendering should keep children', async t => {
  let el = html`<div><${fn}/></div>`
  let abc = el.firstChild

  t.is(el.outerHTML, '<div><abc></abc></div>')

  html`<${el}><${fn}.foo/></>`
  t.is(el.outerHTML, '<div><abc></abc></div>')
  let abc1 = el.firstChild
  t.equal(abc1, abc)

  function fn () { return html`<abc/>` }
})

t.todo('legacy html: extended component rerendering should not destroy instance', async t => {
  let el = html`<div><div is=${fn}/></div>`
  let child = el.firstChild
  html`<${el}><div.foo is=${fn}/></>`
  let child1 = el.firstChild
  t.equal(child1, child)
  function fn(el) { }
})

t.skip('html: functional components create element', t => {
  let log = []
  let el = html`<${el => {
    let e = document.createElement('a')
    log.push(e)
    return e
  }}/>`
  t.is(log, [el])
})

t.skip('html: use assigned via prop', t => {
  let log = []
  let el = html`<a use=${el => {
    log.push(el.tagName.toLowerCase())
    let e = document.createElement('b')
    return e
  }}/>`
  t.is(log, ['a'])
  t.is(el.tagName.toLowerCase(), 'b')
})

t.todo('html: is=string works fine', t => {
  let a = html`<a is=superA />`
})

t.skip('html: props passed to use are actual object', t => {
  let a = html`<foo use=${bar} x=${1}/>`

  function bar(el, props) {
    t.is(props, {x: 1, use: bar})
  }
})

t.skip('html: assigned id must be accessible', async t => {
  let el = html`<x id=x1 />`
  t.is(el.id, 'x1')

  $(el, (el, props) => {
    t.is(el.id, 'x1')
    // t.is(props.id, 'x1')
  })
})

t.skip('html: must update text content', async t => {
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

t.skip('html: must not morph inserted nodes', async t => {
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

t.skip('html: update own children', t => {
  let el = html`<div>123</div>`
  html`<${el}>${ el.childNodes }</>`
  t.is(el.outerHTML, '<div>123</div>')
})

t.skip('html: render to props', t => {
  let el = html`<${X} x=1/>`

  function X (props) {
    html`<${props}>${props.x}</>`
  }

  t.is(el.outerHTML, '<x x="1">1</x>')
})

t.skip('html: must not replace self', t => {
  let el = html`<x is=${x} />`
  t.is(el.outerHTML, '<x></x>')
  function x ({element}) {
    return html`<${element}/>`
  }
  t.is(el.outerHTML, '<x></x>')
})

t.skip('html: externally assigned props must be available', async t => {
  let el = html`<x x=${1}/>`
  document.body.appendChild(el)
  await Promise.resolve().then()
  $('x', (el) => {
    t.is(el.x, 1)
  })
})

t.skip('html: streams must update values dynamically', async t => {
  let obj = { x: 1 }
  let el = html`<div>${ prop(obj, 'x') }</div>`

  await Promise.resolve().then()
  t.is(el.outerHTML, '<div>1</div>')

  obj.x = 2
  await Promise.resolve().then().then()
  t.is(el.outerHTML, '<div>2</div>')
})

t.skip('html: direct value', async t => {
  let x = html`${1}`
  t.is(x.nodeType, 3)
})

t.todo('legacy html: rerendering extended component should not register anonymous function')

t.todo('legacy html: fake gl layers', t => {
  html`<canvas is=${GlCanvas}>
    <${GlLayer}>${gl => { }}<//>
    <${GlLayer}>${gl => { }}<//>
  </canvas>`
})

t.todo('legacy html: insert nodes list', t => {
  let el = document.createElement('div')
  el.innerHTML = '|bar <baz></baz>|'

  let $el = $(el)
  let orig = [...el.childNodes]

  $el.html`<div.prepended /> foo ${ el.childNodes } qux <div.appended />`
  t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)

  $el.html`foo ${ orig } qux`
  t.equal(el.innerHTML, `foo |bar <baz></baz>| qux`)

  $el.html`<div.prepended /> foo ${ orig } qux <div.appended />`
  t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)
})

t.todo('legacy html: handle collections', t => {
  // prepend icons to buttons
  let b = document.body.appendChild(document.createElement('button'))
  b.innerHTML = 'Click <span>-</span>'
  b.setAttribute('icon', 'phone_in_talk')
  let $b = $('button[icon]')
  let $content = $($b[0].childNodes)

  $b.html`<i class="material-icons">${ $b.attr('icon') }</i> ${ $content }`

  t.equal(b.innerHTML, '<i class="material-icons">phone_in_talk</i> Click <span>-</span>')
  document.body.removeChild(b)
})

t.todo('legacy html: insert single Node', t => {
  let $el = $(document.createElement('div'))
  let a = document.createElement('a')
  $el.html`<x>${ a }</x>`
  t.equal($el[0].innerHTML, `<x><a></a></x>`)
})

t.todo('legacy html: insert node directly', t => {
  let $el = $(document.createElement('div'))
  let a = document.createElement('a')
  let frag = document.createDocumentFragment()
  frag.appendChild(a)
  $el.html(frag)
  t.equal($el[0].innerHTML, `<a></a>`)
})

t.todo('legacy html: insert self/array of nodes', t => {
  let $el = $(document.createElement('div'))
  let a1 = document.createElement('a')
  let a2 = document.createElement('a')
  a1.id = 'x'
  a2.id = 'y'
  let $a = $([a1, a2])
  $el.html($a)
  t.equal($el[0].innerHTML, `<a id="x"></a><a id="y"></a>`)
})

t.todo('legacy html: child function as modifier', async t => {
  let $el = html`<div/>`
  $el.html`<a>${ el => {
    t.is(el.tagName, 'A')
    $(el).html`<span/>`
  }}</a>`

  await Promise.resolve().then()

  t.equal($el[0].innerHTML, `<a><span></span></a>`)
})

t.todo('legacy html: child function as reducer', async t => {
  let log = []
  let target = document.createElement('div')

  $(target).$(el => {
    $(el).html`<a foo=bar>${a}</a>`
    t.is(log, ['a'])
  })

  function a(el) {
    log.push('a')
    t.equal(el.tagName, 'A')
    t.equal(el.foo, 'bar')
    return 'xyz'
  }

  await Promise.resolve().then()

  t.is(target.innerHTML, `<a>xyz</a>`)
})

t.todo('legacy html: $ inside of html', t => {
  let $el = $(document.createElement('div'))

  $el.html`<foo>${html`<bar>${html`<baz></baz>`}</bar>qux`}</foo>`

  t.equal($el[0].innerHTML, '<foo><bar><baz></baz></bar>qux</foo>')
})

t.todo('legacy html: re-rendering inner nodes shouldn\'t trigger mount callback', async t => {
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

t.todo('legacy html: h plain node', t => {
  let target = document.createElement('div')

  $(target).html(
    $('x', { foo: 'bar' },
      'Text content', ' ',
    )
  )

  t.equal(target.innerHTML, '<x>Text content </x>')
})

t.todo('legacy html: init aspects on fragments', t => {
  let log = []
  let $a = html`< is=${fn}/>`

  function fn(frag) {
    log.push(frag.nodeType)
  }

  t.is(log, [11])
})

t.todo('legacy html: text content', t => {
  let $el = $(document.createElement('div'))

  $el.html`foo`
  t.equal($el[0].innerHTML, 'foo')

  $el.html('bar')
  t.equal($el[0].innerHTML, 'bar')
})

t.todo('legacy html: object insertions', t => {
  let $a = html`<div>${ {x:1} }</div>`
  t.is($a[0].outerHTML, '<div>[object Object]</div>')
})

t.todo('legacy html: reducers', t => {
  let $el = html`<div><bar/></>`

  // append/prepend
  $el.html(el => {
    el.append(...html`<foo/>`, ...el.childNodes, document.createElement('baz'))
  })

  t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')

  // wrap
  // $el.html(el => html`<div.foo>${ el }</div>`)
  // t.is($el[0].outerHTML, '<div class="foo"><div><foo></foo><bar></bar><baz></baz></div></div>')

  // unwrap
  // $el.html(el => el.children[0].children)
  // t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')
})

t.todo('legacy html: deps', t => {
  let $el = html`<div.foo/>`
})

t.todo('legacy html: other element directly', t => {
  let $el = html`<div/>`
  let $a = html`<a/>`
  $el.html($a[0])

  t.is($el[0].outerHTML, `<div><a></a></div>`)
})

t.todo('legacy html: direct array', t => {
  $(document.createElement('div'), el => {
    $(el, el => {
      let [foo, bar, baz, qux] = html(['foo', ['bar', 'baz'], h('qux')])

      t.equal(el.innerHTML, 'foobarbaz<qux></qux>')
      t.ok(foo instanceof Node)
      t.ok(bar instanceof Node)
      t.ok(baz instanceof Node)
      t.ok(qux instanceof Element)
    })
  })
})

t.todo('legacy html: nested fragments', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t.todo('legacy html: two wrapping aspects', async t => {
  function b(el) {
    html`<div#b>${el.childNodes}</div>`
  }

  let el = document.createElement('div')
  el.innerHTML = 'content'
  $(el, a)
  $(el, b)

  function a(el) {
    html`<div#a>${el.childNodes}</div>`
  }

  t.equal(el.innerHTML, `<div id="b"><div id="a">content</div></div>`)
})

t.skip('html: <host> tag')

t.todo('legacy html: direct components case', async t => {
  let $c = html`<${C} x y=1 z=${2} />`

  function C($el) {
    t.is({ x: $el.x, y: $el.y, z: $el.z }, { x: true, y: '1', z: 2 })

    $el.html`<div></div>`
  }

  await Promise.resolve().then()
  t.equal($c[0].innerHTML, '<div></div>')
})

t.skip('html: connecting aspect as array spread', t => {
  let log = []
  let target = document.createElement('div')

  $(target, el => {
    html`<a foo=bar ...${[a]}/>`
    t.deepEqual(log, ['a'])
  })

  function a(el) {
    log.push('a')
    el.innerHTML = el.foo
  }

  t.equal(target.firstChild.tagName, 'A')
  t.equal(target.textContent, 'bar')
  t.deepEqual(log, ['a'])
})

t.todo('legacy html: class components')

t.skip('html: duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})

t.skip('html: null-like insertions', t => {
  let a = html`<a>foo ${ null } ${ undefined } ${ false } ${0}</a>`

  t.is(a.innerHTML, 'foo    0')

  let b = html`${ null } ${ undefined } ${ false } ${0}`
  t.is(b.textContent, '   0')
  let c = html``
  t.is(c.textContent, '')
})

t.todo('legacy html: parent props must rerender nested components', async t => {
  let $x = html`<div x=0/>`

  $x.$(x => {
    $x.html`<div is=${y} value=${ $x.prop('x') }/>`
  })
  function y ({ value }) {
    $(this).html`value: ${ value }`
  }

  await $x

  t.is($x[0].firstChild.innerHTML, `value: 0`)

  $x.prop('x', 1)

  await $x

  t.is($x[0].firstChild.innerHTML, `value: 1`)
})

t.todo('legacy html: html effect', async t => {
  let $el = html`<a html=${'<span>foo</span>'}/>`

  await $el

  t.is($el[0].innerHTML, `<span>foo</span>`)
})

t.todo('legacy html: it microtasks dom diffing, not applies instantly')

t.todo('legacy html: removing aspected element should trigger destructor', async t => {
  let log = []
  let $el = html`<foo><bar use=${fn} /></foo>`

  function fn (el) {
    log.push(1)
    return () => log.push(2)
  }

  await $el
  t.is(log, [1])

  $el.html`<baz/>`
  await $el
})

t.todo('legacy html: 50+ elements shouldnt invoke recursion', t => {
  let data = Array(100).fill({x:1})

  let el = $`${data.map(item => html`<${fn} ...${item}/>`)}`

  function fn ({html, x}) {
    html`x: ${x}`
  }

  t.is(el.length, 100)
})

t.todo('legacy html: templates', async t => {
  // html`<${C}></>`
  // let { default: htm } = await import('htm')

  htm = htm.bind((...args) => console.log(args))

  htm`<a class="${x} c d"/>`

  function x () {}
  // function C (target) {
  //   console.log(target)
  //   target.html`foo`
  // }
})

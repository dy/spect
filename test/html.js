import t from 'tst'
import $ from '..'

t('html: readme default', t => {
  let $div = $(document.createElement('div'))

  $div.html`<div#id.class foo=bar>baz</div>`

  t.is($div[0].innerHTML, '<div id="id" class="class">baz</div>')
  t.is($div[0].firstChild.foo, 'bar')
})

t('html: attributes', t => {
  let $div = $(document.createElement('div'))

  $div.html`<a href='/' foo=bar>baz</a>`
  t.is($div[0].firstChild.outerHTML, '<a href="/">baz</a>')
  t.is($div[0].firstChild.foo, 'bar')
})

t('html: component static props', async t => {
  let log = []
  let $el = $`<div/>`.html`<${C}#x.y.z/>`

  function C (el) {
    log.push(el.tagName, el.id, el.className)
  }

  await Promise.resolve()
  t.is(log, ['C-0', 'x', 'y z'])
})

t('html: direct component rerendering should not destroy state', async t => {
  let $el = $`<div><${fn}/></div>`
  let $c = $($el[0].firstChild)
  $c.state({ x: 1 })

  await Promise.resolve().then()
  t.is($c.state('x'), 1)

  $el.html`<${fn}.foo/>`

  let $c1 = $($el[0].firstChild)
  t.is($c1.state('x'), 1)
  t.is($c1, $c)
  t.is($c1.class('foo'), true)

  function fn (el) {}
})

t('html: rerendered component state should persist', async t => {
  let $el = $`<div><span.foo/></div>`
  let $c = $($el[0].firstChild)
  $c.state({ x: 1 })

  await Promise.resolve().then()
  t.is($c.state('x'), 1)

  $el.html`<span.foo.bar/>`

  let $c1 = $($el[0].firstChild)
  t.is($c1.state('x'), 1)
  t.is($c1, $c)
  t.is($c1.class('foo'), true)
})

t('html: extended component rerendering should not destroy state', async t => {
  let $el = $`<div><div is=${fn}/></div>`
  let $c = $($el[0].firstChild)
  $c.state({ x: 1 })

  await Promise.resolve().then()
  t.is($c.state('x'), 1)

  $el.html`<div.foo is=${fn}/>`

  let $c1 = $($el[0].firstChild)
  t.is($c1.state('x'), 1)
  t.is($c1, $c)
  t.is($c1.class('foo'), true)

  function fn(el) { }
})

t.todo('html: rerendering extended component should not register anonymous function')

t.todo('html: fake gl layers', t => {
  html`<canvas is=${GlCanvas}>
    <${GlLayer}>${gl => { }}<//>
    <${GlLayer}>${gl => { }}<//>
  </canvas>`
})

t('html: insert nodes list', t => {
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

t('html: handle collections', t => {
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

t('html: insert single Node', t => {
  let $el = $(document.createElement('div'))
  let a = document.createElement('a')
  $el.html`<x>${ a }</x>`
  t.equal($el[0].innerHTML, `<x><a></a></x>`)
})

t('html: insert node directly', t => {
  let $el = $(document.createElement('div'))
  let a = document.createElement('a')
  let frag = document.createDocumentFragment()
  frag.appendChild(a)
  $el.html(frag)
  t.equal($el[0].innerHTML, `<a></a>`)
})

t('html: insert self/array of nodes', t => {
  let $el = $(document.createElement('div'))
  let a1 = document.createElement('a')
  let a2 = document.createElement('a')
  a1.id = 'x'
  a2.id = 'y'
  let $a = $([a1, a2])
  $el.html($a)
  t.equal($el[0].innerHTML, `<a id="x"></a><a id="y"></a>`)
})

t('html: child function as modifier', async t => {
  let $el = $`<div/>`
  $el.html`<a>${ el => {
    t.is(el.tagName, 'A')
    $(el).html`<span/>`
  }}</a>`

  await Promise.resolve().then()

  t.equal($el[0].innerHTML, `<a><span></span></a>`)
})

t('html: child function as reducer', async t => {
  let log = []
  let target = document.createElement('div')

  $(target).use(el => {
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

t('html: $ inside of html', t => {
  let $el = $(document.createElement('div'))

  $el.html`<foo>${$`<bar>${$`<baz></baz>`}</bar>qux`}</foo>`

  t.equal($el[0].innerHTML, '<foo><bar><baz></baz></bar>qux</foo>')
})

t('html: re-rendering inner nodes shouldn\'t trigger mount callback', async t => {
  let log = []
  let $a = $`<div.a><div.b use=${fn}/></>`
  document.body.appendChild($a[0])

  function fn (el) {
    log.push(0)
    $(el).mount(() => {
      log.push(1)
      return () => log.push(2)
    })
  }

  await Promise.resolve().then()
  t.is(log, [0, 1])

  $a.html`<div.b use=${fn}/>`
  await Promise.resolve().then()
  t.is(log, [0, 1, 0])

  $a.html`<div.b use=${fn}/>`
  await Promise.resolve().then()
  t.is(log, [0, 1, 0, 0])

  $a.html``
  await Promise.resolve().then()
  t.is(log, [0, 1, 0, 0, 2])
})

t('html: h plain node', t => {
  let target = document.createElement('div')

  $(target).html(
    $('x', { foo: 'bar' },
      'Text content', ' ',
    )
  )

  t.equal(target.innerHTML, '<x>Text content </x>')
})

t('html: text content', t => {
  let $el = $(document.createElement('div'))

  $el.html`foo`
  t.equal($el[0].innerHTML, 'foo')

  $el.html('bar')
  t.equal($el[0].innerHTML, 'bar')
})

t('html: reducers', t => {
  let $el = $`<div><bar/></>`

  // append/prepend, reduce, wrap/unwrap
  $el.html(children => [$`<foo/>`, ...children, document.createElement('baz')])
  t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')

  $el.html(children => $`<div.foo>${ children }</div>`)
  t.is($el[0].outerHTML, '<div><div class="foo"><foo></foo><bar></bar><baz></baz></div></div>')

  $el.html(([foo]) => foo.childNodes)
  t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')
})

t.todo('html: deps', t => {
  let $el = $`<div.foo/>`
})

t('html: other element directly', t => {
  let $el = $`<div/>`
  let $a = $`<a/>`
  $el.html($a[0])

  t.is($el[0].outerHTML, `<div><a></a></div>`)
})

t.todo('html: direct array', t => {
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

t.todo('html: nested fragments', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t.todo('html: two wrapping aspects', async t => {
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

t('html: direct components case', async t => {
  let $c = $`<${C} x y=1 z=${2} />`

  function C(el) {
    t.is({ x: el.x, y: el.y, z: el.z }, { x: true, y: '1', z: 2 })

    $(el).html`<div></div>`
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

t('html: class components')

t('html: extended web-components')

t.skip('html: duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})

t('html: null-like insertions', t => {
  let $a = $`<a/>`.html`foo ${ null } ${ undefined } ${0}`

  t.is($a[0].innerHTML, 'foo   0')
})

t('html: parent props must rerender nested components', async t => {
  let $x = $`<div x=0/>`

  $x.use(x => {
    $x.html`<div is=${y} value=${ $x.prop('x') }/>`
  })
  function y ({ value }) {
    $(this).html`value: ${ value }`
  }

  await Promise.resolve()

  t.is($x[0].firstChild.innerHTML, `value: 0`)

  $x.prop('x', 1)

  await Promise.resolve()

  t.is($x[0].firstChild.innerHTML, `value: 1`)
})

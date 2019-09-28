import t from 'tst'
import { html, state, cls } from '..'

t('html: apply direct props', async t => {
  let a = document.createElement('a')
  let el = html`<${a}#x.y.z/>`
  t.is(el.className, 'y z')
  t.is(el.id, 'x')
})

t('html: render new children', async t => {
  let a = document.createElement('a')
  let el = html`<${a}>foo <bar><baz/></></>`
  t.is(el.outerHTML, `<a>foo <bar><baz></baz></bar></a>`)
})

t('html: render existing children', async t => {
  let a = document.createElement('a')
  let baz = document.createElement('baz')
  let qux = document.createElement('qux')
  let el = html`<${a}>foo <bar>${baz}</>${qux}</>`
  t.is(el.outerHTML, `<a>foo <bar><baz></baz></bar><qux></qux></a>`)
})

t('html: function renders external component', async t => {
  let el = html`<a>foo <${bar}/></>`

  function bar () {
    return html`<bar/><baz/>`
  }

  t.is(el.outerHTML, `<a>foo <bar></bar><baz></baz></a>`)
})

t('html: fragments', t => {
  let el = html`<foo/><bar/>`
  t.is(el.length, 2)

  let el2 = html`<>foo</>`
  t.is(el2.textContent, 'foo')

  let el3 = html`foo`
  t.is(el3.textContent, 'foo')
})

t('html: put data directly to props', t => {
  let x = {}
  let el = html`<div x=${x}/>`
  t.is(el.x, x)
})

t('legacy html: readme default', async t => {
  let div = document.createElement('div')

  html`<${div}><div#id.class foo=bar>baz</div></div>`

  t.is(div.innerHTML, '<div id="id" class="class">baz</div>')
  t.is(div.firstChild.foo, 'bar')
})

t('legacy html: attributes', t => {
  let div = document.createElement('div')

  html`<${div}><a href='/' foo=bar>baz</a></>`
  t.is(div.firstChild.outerHTML, '<a href="/">baz</a>')
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

t('legacy html: direct component rerendering should not destroy state', async t => {
  let el = html`<div><${fn}/></div>`
  let c = el.firstChild
  state(c, { x: 1 })

  t.is(state(c).x, 1)
  t.is(el.outerHTML, '<div>abc</div>')

  html`<${el}><${fn}.foo/></>`
  t.is(el.outerHTML, '<div>abc</div>')

  let c1 = el.firstChild
  t.is(el.outerHTML, '<div>abc</div>')

  t.is(state(c1).x, 1)
  t.is(c1, c)

  function fn () { return html`abc` }
})

t('legacy html: rerendered component state should persist', async t => {
  let el = html`<div><span.foo/></div>`
  let c = el.firstChild
  state(c, { x: 1 })

  t.is(state(c).x, 1)

  html`<${el}><span.foo.bar/></>`

  let c1 = el.firstChild
  t.is(state(c1).x, 1)
  t.is(c1, c)
  t.is(cls(c1).foo, true)
})

t.todo('legacy html: extended component rerendering should not destroy state', async t => {
  let $el = $`<div><div is=${fn}/></div>`
  let $c = $($el[0].firstChild)
  $c.state({ x: 1 })

  await $c
  t.is($c.state('x'), 1)

  $el.html`<div.foo is=${fn}/>`

  let $c1 = $($el[0].firstChild)
  t.is($c1.state('x'), 1)
  t.is($c1, $c)
  t.is($c1.class('foo'), true)

  function fn(el) { }
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
  let $el = $`<div/>`
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

t.todo('legacy html: $ inside of html', t => {
  let $el = $(document.createElement('div'))

  $el.html`<foo>${$`<bar>${$`<baz></baz>`}</bar>qux`}</foo>`

  t.equal($el[0].innerHTML, '<foo><bar><baz></baz></bar>qux</foo>')
})

t.todo('legacy html: re-rendering inner nodes shouldn\'t trigger mount callback', async t => {
  let log = []
  let $a = $`<div.a><div.b use=${fn}/></>`
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
  let $a = $`< is=${fn}/>`

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
  let $a = $`<div>${ {x:1} }</div>`
  t.is($a[0].outerHTML, '<div>[object Object]</div>')
})

t.todo('legacy html: reducers', t => {
  let $el = $`<div><bar/></>`

  // append/prepend
  $el.html(el => {
    el.append(...$`<foo/>`, ...el.childNodes, document.createElement('baz'))
  })

  t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')

  // wrap
  // $el.html(el => $`<div.foo>${ el }</div>`)
  // t.is($el[0].outerHTML, '<div class="foo"><div><foo></foo><bar></bar><baz></baz></div></div>')

  // unwrap
  // $el.html(el => el.children[0].children)
  // t.is($el[0].outerHTML, '<div><foo></foo><bar></bar><baz></baz></div>')
})

t.todo('legacy html: deps', t => {
  let $el = $`<div.foo/>`
})

t.todo('legacy html: other element directly', t => {
  let $el = $`<div/>`
  let $a = $`<a/>`
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
  let $c = $`<${C} x y=1 z=${2} />`

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

t.todo('legacy html: null-like insertions', t => {
  let $a = $`<a/>`.html`foo ${ null } ${ undefined } ${0}`

  t.is($a[0].innerHTML, 'foo   0')
})

t.todo('legacy html: parent props must rerender nested components', async t => {
  let $x = $`<div x=0/>`

  $x.use(x => {
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
  let $el = $`<a html=${'<span>foo</span>'}/>`

  await $el

  t.is($el[0].innerHTML, `<span>foo</span>`)
})

t.todo('legacy html: it microtasks dom diffing, not applies instantly')

t.todo('legacy html: removing aspected element should trigger destructor', async t => {
  let log = []
  let $el = $`<foo><bar use=${fn} /></foo>`

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

  let el = $`${data.map(item => $`<${fn} ...${item}/>`)}`

  function fn ({html, x}) {
    html`x: ${x}`
  }

  t.is(el.length, 100)
})

t.todo('legacy html: templates', async t => {
  // $`<${C}></>`
  let { default: htm } = await import('htm')

  htm = htm.bind((...args) => console.log(args))

  htm`<a class="${x} c d"/>`

  function x () {}
  // function C (target) {
  //   console.log(target)
  //   target.html`foo`
  // }
})

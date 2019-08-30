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

t('html: pass wrappers themselves', t => {
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

t('html: insert function', async t => {
  let $el = $`<div/>`
  $el.html`<a>${ el => {
    t.is(el.tagName, 'A')
    $(el).html`<span/>`
  }}</a>`

  await Promise.resolve().then()

  t.equal($el[0].innerHTML, `<a><span></span></a>`)
})

t.todo('html: h- reducer', t => {
  let target = document.createElement('div')
  target.innerHTML = '|bar <baz></baz>|'

  $(target, el => {
    html([h('div.prepended'), ' foo ', el.childNodes, ' qux ', h('div.appended')])
    t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)

    html`foo ${el.childNodes} qux`
    t.equal(el.innerHTML, `foo |bar <baz></baz>| qux`)

    html`<div.prepended /> foo ${el.childNodes} qux <div.appended />`
    t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)
  })

  // prepend icons to buttons
  let b = document.body.appendChild(document.createElement('button'))
  b.innerHTML = 'Click'
  b.setAttribute('icon', 'phone_in_talk')
  $('button[icon]', ({ attributes: { icon: { value: icon } }, childNodes }) => html`<i class="material-icons">${icon}</i> ${childNodes}`)

  t.equal(b.innerHTML, '<i class="material-icons">phone_in_talk</i> Click')
  document.body.removeChild(b)

  // TODO: single node inside
  $(document.createElement('div'), el => {
    let a = document.createElement('a')
    html`<x>${a}</x>`
    t.equal(el.innerHTML, `<x><a></a></x>`)
  })
})

t.todo('html: html inside of html', t => {
  $(document.createElement('div'), el => {
    html`<foo>${html`<bar>${html`<baz></baz>`}</bar>qux`}</foo>`

    t.equal(el.innerHTML, '<foo><bar><baz></baz></bar>qux</foo>')
  })
})

t.todo('html: re-rendering inner nodes shouldn\'t trigger mount callback')

t.todo('html: h plain node', t => {
  let target = document.createElement('div')

  $(target, el => {
    let x = html(
      h('x', { foo: 'bar' },
        'Text content', ' ',
      )
    )

    t.equal(x.tagName, 'X')
  })

  t.equal(target.textContent, 'Text content ')
})

t.todo('html: text content', t => {
  $(document.createElement('div'), el => {
    let foo = html`foo`
    t.equal(el.innerHTML, 'foo')
    t.ok(foo instanceof Node)

    let bar = html('bar')
    t.equal(el.innerHTML, 'bar')
    t.ok(bar instanceof Node)
  })
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

t.todo('html: h fragment', t => {
  $(document.createElement('div'), el => {
    let x = html`<>A<>B<>C<d/></></></>`
    t.equal(el.innerHTML, 'ABC<d></d>')
  })
})

t.todo('html: DOM attrs/props', t => {
  let el = document.createElement('x')
  $(el, el => {
    html`<${el} x y=1><a z=${() => { }}>b</a></>`
    t.equal(el.outerHTML, '<x><a>b</a></x>')
  })
})

t.todo('html: multiple root nodes', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>a</><a>b</><foo><bar></bar></foo>`
    t.equal(el.innerHTML, '<a>a</a><a>b</a><foo><bar></bar></foo>')
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

t.skip('html: function components', t => {
  let c = $`<${C} x y=1 z=${2} />`

  function C(el) {
    t.deepEqual({ x: el.x, y: el.y, z: el.z }, { x: true, y: '1', z: 2 })

    html`<${el}><div></div></>`
  }

  t.equal(c.outerHTML, '<div></div>')
})

t.todo('html: connecting aspect as child function', t => {
  let log = []
  let target = document.createElement('div')

  $(target).use(el => {
    $(el).html`<a foo=bar>${a}</a>`
    t.deepEqual(log, ['a'])
  })

  function a(el) {
    log.push('a')
    t.equal(el.tagName, 'A')
    t.equal(el.foo, 'bar')
  }
})

t.todo('html: connecting aspect as anonymous attribute', t => {

})

t.todo('html: connecting aspect as array spread', t => {
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

import t from 'tst'
import $, { html } from '../src/index.js'

const h = html.h

t('html: readme default', t => {
  $(document.createElement('div'), el => {
    let div = html`<div#id.class foo=bar>baz</div>`
    t.equal(el.innerHTML, '<div id="id" class="class">baz</div>')
    t.equal(div.foo, 'bar')
  })
})

t('html: readme attributes', t => {
  $(document.createElement('div'), el => {
    let a = html`<a href='/' foo=bar>baz</a>`
    t.equal(a.outerHTML, '<a href="/">baz</a>')
    t.equal(a.foo, 'bar')
  })
})

t('html: readme fragments', t => {
  $(document.createElement('div'), el => {
    let [foo, bar, baz] = html`<>foo <bar/> baz</>`
    t.equal(el.innerHTML, 'foo <bar></bar> baz')
    t.ok(foo instanceof Node)
    console.log(foo)

    let [foo1, bar1, baz1] = html`foo <bar/> baz`
    t.equal(el.innerHTML, 'foo <bar></bar> baz')
    t.ok(foo1 instanceof Node)

    let [foo2, bar2, baz2] = html(['foo ', html`<bar/>`, ' baz'])
    t.equal(el.innerHTML, 'foo <bar></bar> baz')
    t.ok(foo2 instanceof Node)
  })
})

t('html: readme reducer', t => {
  let target = document.createElement('div')
  target.innerHTML = '|bar <baz></baz>|'

  $(target, el => {
    html`<div.prepended /> foo ${el.childNodes} qux <div.appended />`
    t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)

    html`foo ${el.childNodes} qux`
    t.equal(el.innerHTML, `foo |bar <baz></baz>| qux`)

    html`<div.prepended /> foo ${el.childNodes} qux <div.appended />`
    t.equal(el.innerHTML, `<div class="prepended"></div> foo |bar <baz></baz>| qux <div class="appended"></div>`)
  })

  // // prepend icons to buttons
  let b = document.body.appendChild(document.createElement('button'))
  b.innerHTML = 'Click'
  b.setAttribute('icon', 'phone_in_talk')
  $('button[icon]', ({attributes: { icon: { value: icon } }, childNodes}) => html`<i class="material-icons">${ icon }</i> ${childNodes}` )

  t.equal(b.innerHTML, '<i class="material-icons">phone_in_talk</i> Click')
  document.body.removeChild(b)

  // single node
  $(document.createElement('div'), el => {
    let a = document.createElement('a')
    html`<x>${a}</x>`
    t.equal(el.innerHTML, `<x><a></a></x>`)
  })
})

t('html: h- reducer', t => {
  let target = document.createElement('div')
  target.innerHTML = '|bar <baz></baz>|'

  $(target, el => {
    html([h('div.prepended'), ' foo ',  el.childNodes, ' qux ', h('div.appended')])
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

t('html: html inside of html', t => {
  $(document.createElement('div'), el => {
    html`<foo>${ html`<bar>${ html`<baz></baz>` }</bar>qux` }</foo>`

    t.equal(el.innerHTML, '<foo><bar><baz></baz></bar>qux</foo>')
  })
})

t.todo('html: re-rendering inner nodes shouldn\'t trigger mount callback')

t('html: h plain node', t => {
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

t('html: text content', t => {
  $(document.createElement('div'), el => {
    let foo = html`foo`
    t.equal(el.innerHTML, 'foo')
    t.ok(foo instanceof Node)

    let bar = html('bar')
    t.equal(el.innerHTML, 'bar')
    t.ok(bar instanceof Node)
  })
})

t('html: direct array', t => {
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

t('html: h fragment', t => {
  $(document.createElement('div'), el => {
    let x = html`<>A<>B<>C<d/></></></>`
    t.equal(el.innerHTML, 'ABC<d></d>')
  })
})

t.skip('html: DOM attrs/props', t => {
  let el = document.createElement('x')
  $(el, el => {
    html`<${el} x y=1><a z=${() => {}}>b</a></>`
    t.equal(el.outerHTML, '<x><a>b</a></x>')
  })
})

t('html: multiple root nodes', t => {
  let el = document.createElement('div')
  $(el, el => {
    html`<a>a</><a>b</><foo><bar></bar></foo>`
    t.equal(el.innerHTML, '<a>a</a><a>b</a><foo><bar></bar></foo>')
  })
})

t('html: nested fragments', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t('html: two wrapping aspects', async t => {
  function b (el) {
    html`<div#b>${el.childNodes}</div>`
  }

  let el = document.createElement('div')
  el.innerHTML = 'content'
  $(el, a)
  $(el, b)

  function a (el) {
    html`<div#a>${el.childNodes}</div>`
  }

  t.equal(el.innerHTML, `<div id="b"><div id="a">content</div></div>`)
})

t.skip('html: <host> tag')
t.skip('html: function components', t => {
  let c = html`<${C} x y=1 z=${2} />`

  function C(el) {
    t.deepEqual({ x: el.x, y: el.y, z: el.z }, { x: true, y: '1', z: 2 })

    html`<${el}><div></div></>`
  }

  t.equal(c.outerHTML, '<div></div>')
})

t('html: connecting aspect as child function', t => {
  let log = []
  let target = document.createElement('div')

  $(target, el => {
    html`<a foo=bar>${a}</a>`
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
t('html: connecting aspect as array spread', t => {
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

t.skip('duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})

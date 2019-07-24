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

    let [foo1, bar1, baz1] = html`foo <bar/> baz`
    t.equal(el.innerHTML, 'foo <bar></bar> baz')
    t.ok(foo1 instanceof Node)

    let [foo2, bar2, baz2] = html(['foo ', '<bar/>', ' baz'])
    t.equal(el.innerHTML, 'foo <bar></bar> baz')
    t.ok(foo2 instanceof Node)
  })
})

t.only('html: readme reducer', t => {
  let target = document.createElement('div')
  target.innerHTML = 'bar <baz/>'

  $(target, el => {
    html`<div.prepended /> foo ${el.childNodes} qux <div.appended />`
    t.equal(el.innerHTML, `<div class="prepended"></div> foo bar <baz></baz> qux <div class="appended"></div>`)

    html`foo ${el.childNodes} qux`
    t.equal(el.innerHTML, `foo bar <baz></baz> qux`)

    html`<div.prepended /> foo ${el.childNodes} qux <div.appended />`
    t.equal(el.innerHTML, `<div class="prepended"></div> foo bar <baz></baz> qux <div class="appended"></div>`)
  })

  // TODO: repeatable insertion
  // TODO: single node inside
  // TODO: direct node
  // TODO: direct list

})

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
    // let x = html`foo`

    t.equal(el.innerHTML, 'foo')

    let x = html(
      'Text content', ' ',
      // ['Document', h('', {}, [' ', 'fragment'])],
      // h('img', {}),
      // h('hr'), h('br'),
      // h('div#id.class', { foo: 'bar', baz: true, class: el => { t.equal(el.tagName, 'DIV') } }, [ h('div') ]),
      // el => { t.equal(el, target) },
      // h(Component),
      // h(document.body, null, 'Portal'),
      // h('#id', null, ['Selector portal']),
      // undefined,
      // el.childNodes
    )
    t.equal(el.innerHTML, 'Text content ')
  })
})
t.todo('html: function arg')
t.todo('html: nested HTML arguments')
t.todo('html: <host> tag')

t.skip('html: basic', t => {
  let node = html`<a></a>`
  t.equal(node.outerHTML, '<a></a>')

  let [a, b] = html`<a/><b/>`
  t.equal(a.outerHTML, `<a></a>`)
  t.equal(b.outerHTML, `<b></b>`)

  let el = document.createElement('div')
  let el1 = html`<${el}><foo/></>`
  t.equal(el, el1)
  t.equal(el.outerHTML, '<div><foo></foo></div>')

  t.equal(el, el1)
})

t('html: function components', t=> {
  let c = html`<${C} x y=1 z=${2} />`

  function C (el) {
    t.deepEqual({x: el.x, y: el.y, z: el.z}, {x: true, y: '1', z: 2})

    html`<${el}><div></div></>`
  }

  t.equal(c.outerHTML, '<div></div>')
})

t.skip('html: function as a child (invalid in react)', t => {
  html`<a>${C}</a>`

  function C () {

  }
})

t('html: class components')

t('html: extended web-components')

t('html: DOM attrs/props', t => {
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

t('html: fragment', t => {
  $(document.createElement('div'), el => {
    html`<><a>a</a><b><>b<c/></></b></>`
    t.equal(el.innerHTML, '<a>a</a><b>b<c></c></b>')
  })
})

t('html: wrapping', t => {
  let el = document.createElement('div')
  el.innerHTML = '<a>b</a>'

  $(el, el => {
    html`<b>${el.childNodes}</b>`
    t.equal(el.innerHTML, '<b><a>b</a></b>')
  })
})

t('html: adjacent node', t => {

})

t('html: external node', t => {
  html`<${el}>content</>`
})

t('html: two wrapping aspects', async t => {
  function b (el) {
    html`<div#b>${el}</div>`
  }

  let el = document.createElement('div')
  el.innerHTML = 'content'
  $(el, a)
  $(el, b)

  function a (el) {
    html`<div#a>${el}</div>`
  }

  await (() => {})
  t.equal(el.innerHTML, `<div id="b"><div id="a">content</div></div>`)
})

t.skip('duplicate id warning', t => {
  let el = document.createElement('div')
  el.innerHTML = '<div id="a"></div>'

  t.throws(() => {
    $(el, el => html`<div id="a"></div><...>`)
  })
})

t('html: destructuring result nodes')
t('html: destructuring result ids')


t('html: nested fragments', t => {
  `<><></></>`

})

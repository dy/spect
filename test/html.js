import t from 'tst'
import $, { html, htm } from '../src/index.js'

t('html: mounts VDOM built via h', t => {
  let target = document.createElement('div')

  let h = html.h

  $(target, el => {
    html(
      h('', null,
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
    )
  })

  function Component (el) {

  }

  t.equal(target.textContent, 'Text content ')
})

t('html: basic', t => {
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

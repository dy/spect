import t from 'tst'
import { html, state, cls, $, use, prop } from '..'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let str = '<>'
    this.childNodes.forEach(el => str += el.outerHTML)
    str += '</>'
    return str
  }
})

t('html: apply direct props', async t => {
  let a = document.createElement('a')
  let el = html`<${a}#x.y.z/>`
  t.is(el.className, 'y z')
  t.is(el.id, 'x')
})

t('html: render new children', async t => {
  let a = document.createElement('a')
  let el = html`<${a}>foo <bar><baz.qux/></></>`
  t.is(el.outerHTML, `<a>foo <bar><baz class="qux"></baz></bar></a>`)
})

t('html: render existing children', async t => {
  let a = document.createElement('a')
  let baz = document.createElement('baz')
  let qux = document.createElement('qux')
  let el = html`<${a}>foo <bar>${baz}</>${qux}</>`
  t.is(el.outerHTML, `<a>foo <bar><baz></baz></bar><qux></qux></a>`)
})

t('html: function renders external component', async t => {
  let el = html`<a>foo <${bar}/></><b/>`

  function bar () {
    return html`<bar/><baz/>`
  }

  t.is(el.firstChild.outerHTML, `<a>foo <bar></bar><baz></baz></a>`)
  t.is(el.lastChild.outerHTML, `<b></b>`)
})

t('html: rerendering with props: must persist', async t => {
  let el = document.createElement('x')
  let div = document.createElement('div')

  html`<${el}>${div}<x/></>`
  // t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><${div}/><x/></>`
  // t.equal(el.firstChild, div)
  t.equal(el.childNodes.length, 2)

  html`<${el}><${div}/><x/></>`
  // t.equal(el.firstChild, div)
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

t('html: must not redefine class', async t => {
  let el = html`<a.foo.bar/>`
  t.is(el.className,'foo bar')
  html`<${el}.baz/>`
  t.is(el.className, 'foo bar baz')
  await use(el, el => {
    html`<${el}.qux/>`
  })
  t.is(el.className, 'foo bar baz qux')
})

t('html: fragments', async t => {
  let el = html`<foo/><bar/>`
  t.is(el.childNodes.length, 2)

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

  let wrapped = html`<div>
    <${foo}.foo><bar/></>
  </div>`

  t.is(wrapped.outerHTML, '<div><foo class="foo"><bar></bar></foo></div>')
  t.is(wrapped.firstChild, foo)
  t.is(wrapped.firstChild.x, 1)
})

t('html: promises', async t => {
  let p = new Promise(ok => setTimeout(async () => {
    ok('123')
    await Promise.resolve().then()
    t.is(el.outerHTML, '<div>123</div>')
    el.remove()
  }, 50))

  let el = document.createElement('div')
  document.body.appendChild(el)

  html`<${el}>${p}</>`
  t.is(el.outerHTML, '<div></div>')

  return p
})

t.todo('html: thenable', async t => {
  let thenable = html`Loading...`
  thenable.then(e => new Promise(ok => setTimeout(() => ok(html`Loaded!`), 1000)))

  html`<${el}>${thenable}</>`
})

t.todo('html: generator')

t.todo('html: react-component compatible', t => {

})

t('html: selector elements', t => {
  let el = document.createElement('div')
  el.classList.add('sel')
  document.body.appendChild(el)
  html`<.sel>123</>`
  t.is(el.textContent, '123')
  document.body.removeChild(el)
})

t('html: put data directly to props', async t => {
  let x = {}
  let el = html`<div x=${x}/>`
  t.is(el.x, x)
})

t('html: rerender real dom', t => {
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

t('html: preserve rendering target classes/ids/attribs', t => {
  let el = document.createElement('div')
  el.setAttribute('x', 1)
  el.classList.add('x')
  el.id = 'x'

  html`<${el}#y.z.w w=2/>`

  t.is(el.outerHTML, `<div x="1" class="x z w" id="y" w="2"></div>`)
  t.is(el.x, '1')
  t.is(el.w, '2')
})

t('legacy html: readme default', async t => {
  let div = document.createElement('div')

  html`<${div}><div#id.class foo=bar>baz</div></div>`

  t.is(div.outerHTML, '<div><div foo="bar" id="id" class="class">baz</div></div>')
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

t('legacy html: direct component rerendering should not destroy state', async t => {
  let el = html`<div><${fn}/></div>`
  let abc = el.firstChild
  state(abc, { x: 1 })

  t.is(state(abc).x, 1)
  t.is(el.outerHTML, '<div><abc></abc></div>')

  html`<${el}><${fn}.foo/></>`
  t.is(el.outerHTML, '<div><abc></abc></div>')
  let abc1 = el.firstChild
  t.is(state(abc1).x, 1)
  t.equal(abc1, abc)

  function fn () { return html`<abc/>` }
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

t('legacy html: extended component rerendering should not destroy state', async t => {
  let el = html`<div><div is=${fn}/></div>`
  let child = $(el.firstChild)
  state(child, { x: 1 })

  await child
  t.is(state(child).x, 1)

  html`<${el}><div.foo is=${fn}/></>`

  let child1 = $(el.firstChild)
  t.equal(child1, child)
  t.is(state(child1).x, 1)

  function fn(el) { }
})

t('html: functional components create element', t => {
  let log = []
  let el = html`<${el => {
    let e = document.createElement('a')
    log.push(e)
    return e
  }}/>`
  t.is(log, [el])
})

t('html: use assigned via prop', t => {
  let log = []
  let el = html`<a use=${el => {
    log.push(el.tagName.toLowerCase())
    let e = document.createElement('b')
    return e
  }}/>`
  t.is(log, ['a'])
  t.is(el.tagName.toLowerCase(), 'b')
})

t('html: is=string works fine', t => {
  let a = html`<a is=superA />`
})

t('html: props passed to use are actual object', t => {
  let a = html`<foo use=${bar} x=${1}/>`

  function bar(el, props) {
    t.is(props, {x: 1, use: bar})
  }
})

t('html: assigned id must be accessible', async t => {
  let el = html`<x id=x1 />`
  t.is(el.id, 'x1')

  await use(el, (el, props) => {
    t.is(el.id, 'x1')
    t.is(props.id, 'x1')
  })
})

t('html: must update text content', async t => {
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

t('html: must not morph inserted nodes', async t => {
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

t('html: must not replace self', t => {
  let el = html`<x is=${x} />`
  function x (el) {
    return html`<${el}/>`
  }
})

t('html: externally assigned props must be collected', async t => {
  let el = html`<x x=${1}/>`
  document.body.appendChild(el)
  await Promise.resolve().then()
  use('x', (el, props) => {
    t.is(props, {x: 1})
  })
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

t('html: null-like insertions', t => {
  let a = html`<a>foo ${ null } ${ undefined } ${ false } ${0}</a>`

  t.is(a.innerHTML, 'foo    0')
})

t.todo('legacy html: parent props must rerender nested components', async t => {
  let $x = html`<div x=0/>`

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
  let { default: htm } = await import('htm')

  htm = htm.bind((...args) => console.log(args))

  htm`<a class="${x} c d"/>`

  function x () {}
  // function C (target) {
  //   console.log(target)
  //   target.html`foo`
  // }
})

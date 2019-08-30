import t from 'tst'
import $ from '..'

t('$: create from nodes', t => {
  let el = document.createElement('div')

  let $node = $(el)
  t.ok($node.length, 1)
  t.is($node[0], el)

  let $sameNodes = $([el, el])
  t.is($sameNodes.length, 1)
  t.is($sameNodes[0], el)

  let $difNodes = $([el, document.createElement('div')])
  t.is($difNodes.length, 2)
  t.is($difNodes[0], el)
})

t('$: create new', t => {
  let $new = $('<div/>')
  t.equal($new[0].tagName, 'DIV')

  let $newList = $('<div/><div/>')
  t.equal($newList.length, 2)

  let $tpl = $`<div/><div/>`
  t.equal($tpl.length, 2)
})

t('$: subselect nodes', t => {
  let $foo = $`<foo><bar/></foo>`

  let $bar = $(`bar`, $foo)

  t.is($bar[0], $foo[0].firstChild)
})

t.skip('$: live nodes list as reference under the hood', t => {
  // FIXME: that's insustainable for now: we have to extend Spect class from Proxy-ed prototype,
  // providing numeric access to underneath store, like NodeList etc.
  // The proxy prototype looks
  let el = document.createElement('div')

  el.appendChild(document.createElement`div`)

  let $children = $(el.childNodes)
  t.is($children.length, 1)

  el.appendChild(document.createElement`div`)
  t.is($children.length, 2)
})

t('$: rebinding to other document', async t => {
  let { document } = await import('dom-lite')

  // FIXME: w
  let _$ = $.bind(document)

  var div = document.createElement("div")
  div.className = "foo bar"

  _$(div).use(el => {
    t.is(el.tagName, 'DIV')
  })
})

t('$: ignore wrapping collections', t => {
  let $a = $`<a/>`

  t.equal($($a), $a)
})

t('$: wrapped subsets are fine', t => {
  let $a = $`<a/>`

  t.equal($($a[0]), $a)
})

t('$: fragments', t => {
  let [foo, bar, baz] = $`<>foo <bar/> baz</>`
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  t.ok(foo instanceof Node)

  let [foo1, bar1, baz1] = $`foo <bar/> baz`
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  t.ok(foo1 instanceof Node)

  // let [foo2, bar2, baz2] = $(['foo ', $`<bar/>`, ' baz'])
  // t.equal(el.innerHTML, 'foo <bar></bar> baz')
  // t.ok(foo2 instanceof Node)
})

t('$: empty selectors', t => {
  let $x = $()
  t.is($x.length, 0)

  let $y = $('xyz')
  t.is($y.length, 0)

  let $z = $(null)
  t.is($z.length, 0)

  // NOTE: this one creates content
  // let $w = $`div`
  // t.is($w.length, 0)

  t.notEqual($x, $y)
  t.notEqual($x, $z)
  // t.notEqual($x, $w)
})

t('$: selecting forms', t => {
  let $f = $`<form><input name="a"/><input name="b"/></form>`

  let $form = $($f)

  t.is($f, $form)
  t.is($form[0].childNodes.length, 2)
  t.is($form[0], $f[0])
})

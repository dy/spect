import t from 'tst'
import $ from '../index.js'


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

t.skip('$: sustain dynamic nodes list as reference under the hood', t => {
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

t('$: ')

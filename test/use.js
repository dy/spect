import t from 'tst'
import $ from '../index.js'

t('use: aspects, assigned through parent wrapper', t => {
  // some wrappers over same elements can be created in different ways
  // but effects must be bound to final elements
  let a = document.createElement('a')
  let frag = document.createDocumentFragment()
  frag.appendChild(a)

  let $a1 = $(a)
  let $a2 = $([a])
  let $a3 = $(frag)
  let $a4 = $(frag.childNodes)
  let $a5 = $(frag.querySelector('*'))

  let log = []
  $a3.use(el => {
    t.is(el, a)
    log.push('a3')
  })

  t.is(log, ['a3'])
  t.is($a1[0], a)
  t.is($a2[0], a)
  t.is($a3[0], a)
  t.is($a4[0], a)
  t.is($a5[0], a)
})

t.only('use: aspects must be called in order', t => {
  let log = []
  $`<a/>`.use(() => log.push(1), () => log.push(2), () => log.push(3))
  t.deepEqual(log, [1,2,3])
})

t('use: duplicates are ignored', t => {
  let log = []

  $`<a/>`.use(fn, fn, fn)

  function fn () {
    log.push(1)
  }

  t.is(log, [1])

  $`<a/>`.use(fn, fn, fn)

  t.is(log, [1, 1])
})

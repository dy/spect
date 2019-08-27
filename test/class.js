import t from 'tst'
import $ from '../'

t('class: set/read', t => {
  let $a = $`<a.a.b/>`

  $a.class({a: true, b: true, c: true, d: true})

  t.is($a[0].classList.value, 'a b c d')
})
